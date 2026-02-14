import { z } from 'zod';
export declare const MatchEventSchema: z.ZodObject<{
    type: z.ZodString;
    timestamp: z.ZodNumber;
    data: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strip>;
export declare const MatchSnapshotSchema: z.ZodObject<{
    matchId: z.ZodString;
    seq: z.ZodNumber;
    serverTimeMs: z.ZodNumber;
    clockSec: z.ZodNumber;
    score: z.ZodObject<{
        A: z.ZodNumber;
        B: z.ZodNumber;
    }, z.core.$strip>;
    ball: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
        vx: z.ZodNumber;
        vy: z.ZodNumber;
        vz: z.ZodNumber;
    }, z.core.$strip>;
    players: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        team: z.ZodEnum<{
            A: "A";
            B: "B";
        }>;
        role: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        vx: z.ZodNumber;
        vy: z.ZodNumber;
        state: z.ZodString;
        hasBall: z.ZodBoolean;
    }, z.core.$strip>>;
    events: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        timestamp: z.ZodNumber;
        data: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type MatchSnapshot = z.infer<typeof MatchSnapshotSchema>;
export type MatchEvent = z.infer<typeof MatchEventSchema>;
export declare const MatchStartedEventSchema: z.ZodObject<{
    matchId: z.ZodString;
    seed: z.ZodNumber;
    engineVersion: z.ZodString;
}, z.core.$strip>;
export type MatchStartedEvent = z.infer<typeof MatchStartedEventSchema>;
export declare const MatchFinishedEventSchema: z.ZodObject<{
    matchId: z.ZodString;
    score: z.ZodObject<{
        A: z.ZodNumber;
        B: z.ZodNumber;
    }, z.core.$strip>;
    winner: z.ZodEnum<{
        A: "A";
        B: "B";
        DRAW: "DRAW";
    }>;
    finishedAtMs: z.ZodNumber;
}, z.core.$strip>;
export type MatchFinishedEvent = z.infer<typeof MatchFinishedEventSchema>;
//# sourceMappingURL=index.d.ts.map