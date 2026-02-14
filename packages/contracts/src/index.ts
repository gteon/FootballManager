import { z } from 'zod';

export const MatchEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  data: z.unknown().optional(),
});

export const MatchSnapshotSchema = z.object({
  matchId: z.string(),
  seq: z.number().int().nonnegative(),
  serverTimeMs: z.number().int().nonnegative(),
  clockSec: z.number().nonnegative(),
  score: z.object({
    A: z.number().int().nonnegative(),
    B: z.number().int().nonnegative(),
  }),
  ball: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    vx: z.number(),
    vy: z.number(),
    vz: z.number(),
  }),
  players: z.array(
    z.object({
      id: z.string(),
      team: z.enum(['A', 'B']),
      role: z.string(),
      x: z.number(),
      y: z.number(),
      vx: z.number(),
      vy: z.number(),
      state: z.string(),
      hasBall: z.boolean(),
    }),
  ),
  events: z.array(MatchEventSchema),
});

export type MatchSnapshot = z.infer<typeof MatchSnapshotSchema>;
export type MatchEvent = z.infer<typeof MatchEventSchema>;

export const MatchStartedEventSchema = z.object({
  matchId: z.string(),
  seed: z.number().int(),
  engineVersion: z.string(),
});

export type MatchStartedEvent = z.infer<typeof MatchStartedEventSchema>;

export const MatchFinishedEventSchema = z.object({
  matchId: z.string(),
  score: z.object({
    A: z.number().int().nonnegative(),
    B: z.number().int().nonnegative(),
  }),
  winner: z.enum(['A', 'B', 'DRAW']),
  finishedAtMs: z.number().int().nonnegative(),
});

export type MatchFinishedEvent = z.infer<typeof MatchFinishedEventSchema>;
