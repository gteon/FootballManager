import { z } from 'zod';
import { LeagueService } from './league.service';
declare const JoinBodySchema: z.ZodObject<{
    userId: z.ZodString;
}, z.core.$strip>;
type JoinBody = z.infer<typeof JoinBodySchema>;
export declare class LeagueController {
    private readonly leagues;
    constructor(leagues: LeagueService);
    join(body: JoinBody): {
        userId: string;
        lobbyId: string;
        endsAtMs: number;
    };
    status(userId: string): {
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
    league(leagueId: string): {
        leagueId: string;
        lobbyId: string;
        createdAtMs: number;
        participants: {
            id: string;
            type: "human" | "bot";
        }[];
        matches: Array<{
            aId: string;
            bId: string;
            round: number;
        } & {
            matchId?: string;
        }>;
    };
}
export {};
