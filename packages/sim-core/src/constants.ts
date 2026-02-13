export const PITCH_W = 900;
export const PITCH_H = 520;
export const PLAYER_RADIUS = 11;
export const BALL_RADIUS = 7;
export const GOAL_W = 90;
export const FRICTION = 0.055;
export const GRAVITY = 520;
export const BOUNCE_DAMP = 0.48;
export const Z_PICKUP = 38;
export const DECISION_INTERVAL = 0.32;

export const GOAL_DEPTH = 14;
export const MAX_PASS_DIST = 320;
export const AWARENESS_R = 170;
export const SEPARATION_RADIUS = 26;

export const ROLES = {
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  ATT: 'ATT',
  WIN: 'WIN',
} as const;

export const STATES = {
  IDLE: 'IDLE',
  MOVING: 'MOVING',
  WITH_BALL: 'WITH_BALL',
  PRESSING: 'PRESSING',
  RETURNING: 'RETURNING',
  SHOOTING: 'SHOOTING',
  RECEIVING: 'RECEIVING',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type State = typeof STATES[keyof typeof STATES];
