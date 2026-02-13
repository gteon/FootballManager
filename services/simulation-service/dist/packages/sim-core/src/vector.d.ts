export type Vec2 = {
    x: number;
    y: number;
};
export declare const v2: {
    add: (a: Vec2, b: Vec2) => Vec2;
    sub: (a: Vec2, b: Vec2) => Vec2;
    scale: (a: Vec2, s: number) => Vec2;
    len: (a: Vec2) => number;
    norm: (a: Vec2) => Vec2;
    lerp: (a: Vec2, b: Vec2, t: number) => Vec2;
    dot: (a: Vec2, b: Vec2) => number;
    dist: (a: Vec2, b: Vec2) => number;
    clamp: (v: number, lo: number, hi: number) => number;
};
