import { z } from 'zod';

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
});

export type MatchSnapshot = z.infer<typeof MatchSnapshotSchema>;

export const MatchStartedEventSchema = z.object({
  matchId: z.string(),
  seed: z.number().int(),
  engineVersion: z.string(),
});

export type MatchStartedEvent = z.infer<typeof MatchStartedEventSchema>;
