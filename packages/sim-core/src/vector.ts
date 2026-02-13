export type Vec2 = { x: number; y: number };

export const v2 = {
  add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s }),
  len: (a: Vec2): number => Math.hypot(a.x, a.y),
  norm: (a: Vec2): Vec2 => {
    const l = Math.hypot(a.x, a.y) || 1e-9;
    return { x: a.x / l, y: a.y / l };
  },
  lerp: (a: Vec2, b: Vec2, t: number): Vec2 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }),
  dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,
  dist: (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y),
  clamp: (v: number, lo: number, hi: number): number =>
    Math.max(lo, Math.min(hi, v)),
};
