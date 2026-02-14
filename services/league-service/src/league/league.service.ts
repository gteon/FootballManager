import { Injectable, type OnModuleInit } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';
import type { MatchFinishedEvent } from '@footballmanager/contracts';

type Participant = {
  id: string;
  type: 'human' | 'bot';
};

type Lobby = {
  lobbyId: string;
  createdAtMs: number;
  endsAtMs: number;
  participants: Participant[];
  state: 'open' | 'closed';
  closeTimer?: NodeJS.Timeout;
};

type LeagueMatch = {
  aId: string;
  bId: string;
  round: number;
};

type League = {
  leagueId: string;
  lobbyId: string;
  createdAtMs: number;
  participants: Participant[];
  matches: Array<LeagueMatch & { matchId?: string }>;
};

type JoinResult = {
  userId: string;
  lobbyId: string;
  endsAtMs: number;
};

type StatusResult = {
  userId: string;
  lobby?: { lobbyId: string; endsAtMs: number };
  league?: { leagueId: string };
  assignedMatch?: { matchId: string; url: string };
  liveMatches?: Array<{ matchId: string; url: string }>;
};

type MatchCreatedEvent = {
  matchId: string;
  leagueId: string;
  round: number;
  aId: string;
  bId: string;
};

class XorShift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
    if (this.state === 0) this.state = 0x12345678;
  }

  nextU32(): number {
    let x = this.state | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x | 0;
    return x >>> 0;
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    const span = maxInclusive - minInclusive + 1;
    return minInclusive + (this.nextU32() % span);
  }
}

function makeId(prefix: string, rng: XorShift32): string {
  return `${prefix}_${Date.now()}_${rng.nextU32()}`;
}

@Injectable()
export class LeagueService implements OnModuleInit {
  private lobby: Lobby | null = null;
  private readonly leagues = new Map<string, League>();
  private readonly userToLobby = new Map<string, string>();
  private readonly userToLeague = new Map<string, string>();
  private readonly userToAssignedMatch = new Map<string, string>();
  private readonly matchResults = new Map<
    string,
    { score: { A: number; B: number }; winner: 'A' | 'B' | 'DRAW'; finishedAtMs: number }
  >();
  private readonly leagueCountdowns = new Map<
    string,
    { round: number; startsAtMs: number; timer: NodeJS.Timeout }
  >();

  constructor(private readonly nats: NatsService) {}

  onModuleInit(): void {
    this.nats.subscribeJson<MatchCreatedEvent>('evt.match.created', (evt) => {
      const leagueId = String(evt.leagueId ?? '');
      if (!leagueId) return;
      const league = this.leagues.get(leagueId);
      if (!league) return;

      const aId = String(evt.aId);
      const bId = String(evt.bId);
      const round = Number(evt.round);
      const matchId = String(evt.matchId);

      const target = league.matches.find(
        (m) => m.round === round && m.aId === aId && m.bId === bId,
      );
      if (target) target.matchId = matchId;

      for (const userId of [aId, bId]) {
        if (userId.startsWith('bot_')) continue;
        this.userToLeague.set(userId, leagueId);
        this.userToAssignedMatch.set(userId, matchId);

        this.nats.publishJson('evt.player.match_assigned', {
          userId,
          leagueId,
          matchId,
          url: `http://localhost:5173/match/${matchId}`,
        });
      }
    });

    this.nats.subscribeJson<MatchFinishedEvent>('evt.match.finished', (evt) => {
      const matchId = String(evt.matchId ?? '');
      if (!matchId) return;

      this.matchResults.set(matchId, {
        score: { A: evt.score.A, B: evt.score.B },
        winner: evt.winner,
        finishedAtMs: evt.finishedAtMs,
      });

      const league = this.findLeagueByMatchId(matchId);
      if (!league) return;

      const matchEntry = league.matches.find((m) => m.matchId === matchId);
      if (!matchEntry) return;

      const round = matchEntry.round;

      const roundMatches = league.matches
        .filter((m) => m.round === round)
        .filter((m): m is LeagueMatch & { matchId: string } => Boolean(m.matchId));

      const allFinished =
        roundMatches.length > 0 &&
        roundMatches.every((m) => this.matchResults.has(m.matchId));

      if (!allFinished) return;

      // Avoid double scheduling for the same league/round.
      const existing = this.leagueCountdowns.get(league.leagueId);
      if (existing && existing.round === round + 1) return;

      const startsAtMs = Date.now() + 5 * 60_000;
      const timer = setTimeout(() => {
        this.leagueCountdowns.delete(league.leagueId);
        this.createNextRound(league.leagueId, round);
      }, 5 * 60_000);

      this.leagueCountdowns.set(league.leagueId, {
        round: round + 1,
        startsAtMs,
        timer,
      });

      this.nats.publishJson('evt.league.next_round_countdown', {
        leagueId: league.leagueId,
        round: round + 1,
        startsAtMs,
      });
    });
  }

  join(userId: string): JoinResult {
    // ensure single open lobby
    const now = Date.now();
    if (!this.lobby || this.lobby.state !== 'open') {
      const rng = new XorShift32((now & 0xffffffff) ^ 0x9e3779b9);
      const lobbyId = makeId('lobby', rng);
      const endsAtMs = now + 30_000;
      this.lobby = {
        lobbyId,
        createdAtMs: now,
        endsAtMs,
        participants: [],
        state: 'open',
      };

      this.lobby.closeTimer = setTimeout(() => {
        this.closeLobby(lobbyId);
      }, 30_000);

      this.nats.publishJson('evt.lobby.opened', {
        lobbyId,
        endsAtMs,
        capacity: 16,
      });
    }

    if (this.userToLobby.has(userId)) {
      return {
        userId,
        lobbyId: this.userToLobby.get(userId)!,
        endsAtMs: this.lobby.endsAtMs,
      };
    }

    const lobby = this.lobby;
    if (lobby.participants.length >= 16) {
      // If full, force close and create a new one.
      void this.closeLobby(lobby.lobbyId);
      return this.join(userId);
    }

    lobby.participants.push({ id: userId, type: 'human' });
    this.userToLobby.set(userId, lobby.lobbyId);

    this.nats.publishJson('evt.lobby.player_joined', {
      lobbyId: lobby.lobbyId,
      userId,
    });

    return { userId, lobbyId: lobby.lobbyId, endsAtMs: lobby.endsAtMs };
  }

  getStatus(userId: string): StatusResult {
    const leagueId = this.userToLeague.get(userId);
    const assignedMatchId = this.userToAssignedMatch.get(userId);

    const league = leagueId ? this.leagues.get(leagueId) : undefined;

    return {
      userId,
      lobby:
        this.lobby && this.lobby.state === 'open'
          ? {
              lobbyId: this.lobby.lobbyId,
              endsAtMs: this.lobby.endsAtMs,
            }
          : undefined,
      league: leagueId ? { leagueId } : undefined,
      assignedMatch: assignedMatchId
        ? {
            matchId: assignedMatchId,
            url: `http://localhost:5173/match/${assignedMatchId}`,
          }
        : undefined,
      liveMatches: league
        ? league.matches
            .filter((m) => m.round === 1)
            .filter((m): m is LeagueMatch & { matchId: string } =>
              Boolean(m.matchId),
            )
            .map((m) => ({
              matchId: m.matchId,
              url: `http://localhost:5173/match/${m.matchId}`,
            }))
        : undefined,
    };
  }

  getLeague(leagueId: string): League {
    const league = this.leagues.get(leagueId);
    if (!league) throw new Error('league not found');
    return league;
  }

  private findLeagueByMatchId(matchId: string): League | null {
    for (const league of this.leagues.values()) {
      if (league.matches.some((m) => m.matchId === matchId)) return league;
    }
    return null;
  }

  private createNextRound(leagueId: string, finishedRound: number): void {
    const league = this.leagues.get(leagueId);
    if (!league) return;

    const currentRound = finishedRound;
    const nextRound = currentRound + 1;

    const roundMatches = league.matches
      .filter((m) => m.round === currentRound)
      .filter((m): m is LeagueMatch & { matchId: string } => Boolean(m.matchId));

    const winners: string[] = [];
    for (const m of roundMatches) {
      const res = this.matchResults.get(m.matchId);
      if (!res) return;

      if (res.winner === 'A') winners.push(m.aId);
      else if (res.winner === 'B') winners.push(m.bId);
      else winners.push(m.aId);
    }

    if (winners.length < 2) {
      this.nats.publishJson('evt.league.finished', {
        leagueId,
        winnerId: winners[0] ?? null,
      });
      return;
    }

    const rng = new XorShift32(((league.createdAtMs & 0xffffffff) ^ (nextRound * 0x9e3779b9)) | 0);

    const newMatches: Array<LeagueMatch> = [];
    for (let i = 0; i < winners.length; i += 2) {
      const aId = winners[i];
      const bId = winners[i + 1];
      if (!aId || !bId) break;
      newMatches.push({ aId, bId, round: nextRound });
      league.matches.push({ aId, bId, round: nextRound });

      const seed = rng.nextInt(-1_000_000_000, 1_000_000_000);
      this.nats.publishJson('cmd.match.create', {
        leagueId,
        round: nextRound,
        aId,
        bId,
        seed,
        engineVersion: 'v0',
      });
    }

    this.nats.publishJson('evt.league.round_created', {
      leagueId,
      round: nextRound,
      matches: newMatches,
    });
  }

  private closeLobby(expectedLobbyId: string): void {
    const lobby = this.lobby;
    if (!lobby || lobby.lobbyId !== expectedLobbyId) return;
    if (lobby.state !== 'open') return;

    lobby.state = 'closed';
    if (lobby.closeTimer) clearTimeout(lobby.closeTimer);

    // Fill with bots to 16.
    const participants: Participant[] = [...lobby.participants];
    let botIndex = 1;
    while (participants.length < 16) {
      participants.push({
        id: `bot_${lobby.lobbyId}_${botIndex}`,
        type: 'bot',
      });
      botIndex += 1;
    }

    const rng = new XorShift32((lobby.createdAtMs & 0xffffffff) ^ 0x85ebca6b);

    const leagueId = makeId('league', rng);
    const league: League = {
      leagueId,
      lobbyId: lobby.lobbyId,
      createdAtMs: Date.now(),
      participants,
      matches: [],
    };

    // Round 1: 8 matches; simple pairing in join order.
    for (let i = 0; i < 16; i += 2) {
      const a = participants[i];
      const b = participants[i + 1];
      league.matches.push({ aId: a.id, bId: b.id, round: 1 });
      const seed = rng.nextInt(-1_000_000_000, 1_000_000_000);

      this.nats.publishJson('cmd.match.create', {
        leagueId,
        round: 1,
        aId: a.id,
        bId: b.id,
        seed,
        engineVersion: 'v0',
      });
    }

    this.leagues.set(leagueId, league);

    this.nats.publishJson('evt.lobby.closed', { lobbyId: lobby.lobbyId });
    this.nats.publishJson('evt.league.started', {
      leagueId,
      lobbyId: lobby.lobbyId,
      participants,
    });
    this.nats.publishJson('evt.league.round_created', {
      leagueId,
      round: 1,
      matches: league.matches,
    });

    // Reset lobby slot for next cycle.
    this.lobby = null;
  }

  openLobbiesCount(): number {
    return this.lobby ? 1 : 0;
  }
}
