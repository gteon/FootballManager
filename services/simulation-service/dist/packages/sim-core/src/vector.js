export const v2 = {
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
    scale: (a, s) => ({ x: a.x * s, y: a.y * s }),
    len: (a) => Math.hypot(a.x, a.y),
    norm: (a) => {
        const l = Math.hypot(a.x, a.y) || 1e-9;
        return { x: a.x / l, y: a.y / l };
    },
    lerp: (a, b, t) => ({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    }),
    dot: (a, b) => a.x * b.x + a.y * b.y,
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
};
//# sourceMappingURL=vector.js.map