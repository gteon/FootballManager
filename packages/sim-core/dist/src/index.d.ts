export type Vec2 = {
    x: number;
    y: number;
};
export type TeamId = 'A' | 'B';
export type PlayerSnapshot = {
    id: string;
    team: TeamId;
    role: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    state: string;
    hasBall: boolean;
};
export type MatchSnapshot = {
    matchId: string;
    seq: number;
    serverTimeMs: number;
    clockSec: number;
    score: {
        A: number;
        B: number;
    };
    ball: {
        x: number;
        y: number;
        z: number;
    };
    players: PlayerSnapshot[];
};
export type EngineConfig = {
    matchId: string;
    seed: number;
    engineVersion: string;
};
export declare class Engine {
    private readonly config;
    private readonly rng;
    private seq;
    private clockSec;
    private readonly startedAtMs;
    constructor(config: EngineConfig);
    tick(dtSec: number): void;
    getSnapshot(): MatchSnapshot;
}
export declare function createEngine(config: EngineConfig): Engine;
//# sourceMappingURL=index.d.ts.map