import { Injectable } from '@nestjs/common';

export type MatchStatus = 'created' | 'in_progress' | 'finished';

export type MatchRecord = {
  matchId: string;
  leagueId: string;
  round: number;
  aId: string;
  bId: string;
  seed: number;
  engineVersion: string;
  status: MatchStatus;
  createdAtMs: number;
  startedAtMs?: number;
  finishedAtMs?: number;
};

@Injectable()
export class MatchRegistryService {
  private readonly matches = new Map<string, MatchRecord>();
  private readonly leagueToMatches = new Map<string, Set<string>>();

  upsert(record: MatchRecord): void {
    this.matches.set(record.matchId, record);

    const set = this.leagueToMatches.get(record.leagueId) ?? new Set<string>();
    set.add(record.matchId);
    this.leagueToMatches.set(record.leagueId, set);
  }

  get(matchId: string): MatchRecord | undefined {
    return this.matches.get(matchId);
  }

  markFinished(matchId: string, finishedAtMs: number): void {
    const prev = this.matches.get(matchId);
    if (!prev) return;
    if (prev.status === 'finished') return;

    this.upsert({
      ...prev,
      status: 'finished',
      finishedAtMs,
    });
  }

  listByLeague(leagueId: string): MatchRecord[] {
    const ids = this.leagueToMatches.get(leagueId);
    if (!ids) return [];
    return [...ids]
      .map((id) => this.matches.get(id))
      .filter((m): m is MatchRecord => Boolean(m));
  }

  listInProgressByLeague(leagueId: string): MatchRecord[] {
    return this.listByLeague(leagueId).filter(
      (m) => m.status === 'in_progress',
    );
  }

  count(): number {
    return this.matches.size;
  }
}
