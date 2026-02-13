import { Vec2 } from './vector';
import { Role, State } from './constants';
import { XorShift32 } from './rng';
export type PlayerStats = {
    pace: number;
    passing: number;
    shooting: number;
    stamina: number;
    positioning: number;
    reflexes: number;
};
export declare class Player {
    readonly id: string;
    readonly team: 'A' | 'B';
    readonly role: Role;
    readonly homePos: Vec2;
    readonly stats: PlayerStats;
    readonly maxSpeed: number;
    pos: Vec2;
    vel: Vec2;
    targetPos: Vec2;
    state: State;
    decisionTimer: number;
    hasBall: boolean;
    receivingTarget: Vec2 | null;
    stateTimer: number;
    clearanceCooldown: number;
    constructor(id: string, team: 'A' | 'B', role: Role, homePos: Vec2, stats: PlayerStats, rng: XorShift32);
    update(dt: number, ball: Ball, teammates: Player[], opponents: Player[]): void;
    private _steer;
}
export declare class Ball {
    pos: Vec2;
    vel: Vec2;
    z: number;
    vz: number;
    owner: Player | null;
    inFlight: boolean;
    isAerial: boolean;
    target: Vec2 | null;
    lastKicker: Player | null;
    bounceCount: number;
    constructor();
    update(dt: number): void;
    launchGround(from: Vec2, to: Vec2, speed: number): void;
}
//# sourceMappingURL=player.d.ts.map