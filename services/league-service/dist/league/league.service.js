"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueService = void 0;
const common_1 = require("@nestjs/common");
const nats_service_1 = require("../nats/nats.service");
class XorShift32 {
    state;
    constructor(seed) {
        this.state = seed | 0;
        if (this.state === 0)
            this.state = 0x12345678;
    }
    nextU32() {
        let x = this.state | 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x | 0;
        return x >>> 0;
    }
    nextInt(minInclusive, maxInclusive) {
        const span = maxInclusive - minInclusive + 1;
        return minInclusive + (this.nextU32() % span);
    }
}
function makeId(prefix, rng) {
    return `${prefix}_${Date.now()}_${rng.nextU32()}`;
}
let LeagueService = class LeagueService {
    nats;
    lobby = null;
    leagues = new Map();
    userToLobby = new Map();
    userToLeague = new Map();
    userToAssignedMatch = new Map();
    constructor(nats) {
        this.nats = nats;
    }
    onModuleInit() {
        this.nats.subscribeJson('evt.match.created', (evt) => {
            const leagueId = String(evt.leagueId ?? '');
            if (!leagueId)
                return;
            const league = this.leagues.get(leagueId);
            if (!league)
                return;
            const aId = String(evt.aId);
            const bId = String(evt.bId);
            const round = Number(evt.round);
            const matchId = String(evt.matchId);
            const target = league.matches.find((m) => m.round === round && m.aId === aId && m.bId === bId);
            if (target)
                target.matchId = matchId;
            for (const userId of [aId, bId]) {
                if (userId.startsWith('bot_'))
                    continue;
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
    }
    join(userId) {
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
                lobbyId: this.userToLobby.get(userId),
                endsAtMs: this.lobby.endsAtMs,
            };
        }
        const lobby = this.lobby;
        if (lobby.participants.length >= 16) {
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
    getStatus(userId) {
        const leagueId = this.userToLeague.get(userId);
        const assignedMatchId = this.userToAssignedMatch.get(userId);
        const league = leagueId ? this.leagues.get(leagueId) : undefined;
        return {
            userId,
            lobby: this.lobby && this.lobby.state === 'open'
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
                    .filter((m) => Boolean(m.matchId))
                    .map((m) => ({
                    matchId: m.matchId,
                    url: `http://localhost:5173/match/${m.matchId}`,
                }))
                : undefined,
        };
    }
    getLeague(leagueId) {
        const league = this.leagues.get(leagueId);
        if (!league)
            throw new Error('league not found');
        return league;
    }
    closeLobby(expectedLobbyId) {
        const lobby = this.lobby;
        if (!lobby || lobby.lobbyId !== expectedLobbyId)
            return;
        if (lobby.state !== 'open')
            return;
        lobby.state = 'closed';
        if (lobby.closeTimer)
            clearTimeout(lobby.closeTimer);
        const participants = [...lobby.participants];
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
        const league = {
            leagueId,
            lobbyId: lobby.lobbyId,
            createdAtMs: Date.now(),
            participants,
            matches: [],
        };
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
        this.lobby = null;
    }
    openLobbiesCount() {
        return this.lobby ? 1 : 0;
    }
};
exports.LeagueService = LeagueService;
exports.LeagueService = LeagueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nats_service_1.NatsService])
], LeagueService);
//# sourceMappingURL=league.service.js.map