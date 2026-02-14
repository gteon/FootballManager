import { FootballEngine, type EngineSnapshot, type MatchEvent, type EngineConfig } from './engine';
import { Player, Ball, type PlayerStats } from './player';
import { XorShift32 } from './rng';
import { Vec2, v2 } from './vector';
export { FootballEngine, Player, Ball, XorShift32, v2 };
export type { Vec2 };
export type { EngineSnapshot, MatchEvent, EngineConfig, PlayerStats };
export type { Role, State } from './constants';
export declare function createEngine(config: EngineConfig): FootballEngine;
