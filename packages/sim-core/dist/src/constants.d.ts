export declare const PITCH_W = 900;
export declare const PITCH_H = 520;
export declare const PLAYER_RADIUS = 8;
export declare const BALL_RADIUS = 6;
export declare const GOAL_W = 80;
export declare const FRICTION = 0.035;
export declare const GRAVITY = 520;
export declare const BOUNCE_DAMP = 0.48;
export declare const Z_PICKUP = 38;
export declare const DECISION_INTERVAL = 0.4;
export declare const ROLES: {
    readonly GK: "GK";
    readonly DEF: "DEF";
    readonly MID: "MID";
    readonly ATT: "ATT";
    readonly WIN: "WIN";
};
export declare const STATES: {
    readonly IDLE: "IDLE";
    readonly MOVING: "MOVING";
    readonly WITH_BALL: "WITH_BALL";
    readonly PRESSING: "PRESSING";
    readonly RETURNING: "RETURNING";
    readonly SHOOTING: "SHOOTING";
    readonly RECEIVING: "RECEIVING";
};
export type Role = typeof ROLES[keyof typeof ROLES];
export type State = typeof STATES[keyof typeof STATES];
//# sourceMappingURL=constants.d.ts.map