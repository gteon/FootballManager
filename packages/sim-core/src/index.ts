import { FootballEngine, type EngineSnapshot, type MatchEvent, type EngineConfig } from './engine';
import { Player, Ball, type PlayerStats } from './player';
import { XorShift32 } from './rng';
import { Vec2, v2 } from './vector';

// Classes and values
export const FootballEngine = class FootballEngine {};
export const Player = class Player {};
export const Ball = class Ball {};
export const XorShift32 = class XorShift32 {};
export const Vec2 = {} as any;
export const v2 = {} as any;

// Types
export type { EngineSnapshot, MatchEvent, EngineConfig, PlayerStats };
export type { Role, State } from './constants';

export function createEngine(config: EngineConfig): FootballEngine {
  return new FootballEngine(config);
}
