import { z } from 'zod';
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
}, z.core.$strip>;
export type MatchSnapshot = z.infer<typeof MatchSnapshotSchema>;
export declare const MatchStartedEventSchema: z.ZodObject<{
    matchId: z.ZodString;
    seed: z.ZodNumber;
    engineVersion: z.ZodString;
}, z.core.$strip>;
export type MatchStartedEvent = z.infer<typeof MatchStartedEventSchema>;
