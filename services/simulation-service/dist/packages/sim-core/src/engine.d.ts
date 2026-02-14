import { Player, Ball } from './player';
export type MatchEvent = {
    type: 'GOAL' | 'SAVE' | 'BALL_OUT' | 'PASS' | 'SHOT' | 'CLEARANCE' | 'HALF_TIME' | 'FULL_TIME';
    data?: any;
    timestamp: number;
};
export type EngineSnapshot = {
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
        vx: number;
        vy: number;
        vz: number;
    };
    players: Array<{
        id: string;
        team: 'A' | 'B';
        role: string;
        x: number;
        y: number;
        vx: number;
        vy: number;
        state: string;
        hasBall: boolean;
    }>;
    events: MatchEvent[];
};
export type EngineConfig = {
    matchId: string;
    seed: number;
    engineVersion: string;
};
export declare class FootballEngine {
    private readonly config;
    private readonly rng;
    private seq;
    private clockSec;
    private half;
    private finished;
    private readonly startedAtMs;
    private events;
    private halfTimeBreakRemainingSec;
    readonly ball: Ball;
    readonly teamA: Player[];
    readonly teamB: Player[];
    readonly allPlayers: Player[];
    score: {
        A: number;
        B: number;
    };
    running: boolean;
    constructor(config: EngineConfig);
    start(): void;
    pause(): void;
    tick(dtSec: number): void;
    getSnapshot(): EngineSnapshot;
    private _decide;
    private _decideWithoutBall;
    private _decideWithBall;
    private _positionValue;
    private _progressValue;
    private _receiverOpenness;
    private _interceptRisk;
    private _isLineClearRadius;
    private _inOwnHalf;
    private _doClearance;
    private _shoot;
    private _pass;
    private _findInterceptor;
    private _distToSegment;
    private _calcPressure;
    private _applySeparation;
    private _checkPickup;
    private _checkGoal;
    private _checkBallOut;
    private _kickoff;
}
