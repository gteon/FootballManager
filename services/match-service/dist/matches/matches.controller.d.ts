import { z } from 'zod';
import { MatchesService } from './matches.service';
declare const StartMatchBodySchema: z.ZodObject<{
    seed: z.ZodNumber;
    engineVersion: z.ZodString;
}, z.core.$strip>;
type StartMatchBody = z.infer<typeof StartMatchBodySchema>;
export declare class MatchesController {
    private readonly matches;
    constructor(matches: MatchesService);
    create(): import("./matches.service").CreateMatchResult;
    start(matchId: string, body: StartMatchBody): {
        ok: boolean;
    };
}
export {};
