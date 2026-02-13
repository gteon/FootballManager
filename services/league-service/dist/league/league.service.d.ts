import { type OnModuleInit } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';
type Participant = {
    id: string;
    type: 'human' | 'bot';
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
    matches: Array<LeagueMatch & {
        matchId?: string;
    }>;
};
type JoinResult = {
    userId: string;
    lobbyId: string;
    endsAtMs: number;
};
type StatusResult = {
    userId: string;
    lobby?: {
        lobbyId: string;
        endsAtMs: number;
    };
    league?: {
        leagueId: string;
    };
    assignedMatch?: {
        matchId: string;
        url: string;
    };
    liveMatches?: Array<{
        matchId: string;
        url: string;
    }>;
};
export declare class LeagueService implements OnModuleInit {
    private readonly nats;
    private lobby;
    private readonly leagues;
    private readonly userToLobby;
    private readonly userToLeague;
    private readonly userToAssignedMatch;
    constructor(nats: NatsService);
    onModuleInit(): void;
    join(userId: string): JoinResult;
    getStatus(userId: string): StatusResult;
    getLeague(leagueId: string): League;
    private closeLobby;
}
export {};
