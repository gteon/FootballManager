class XorShift32 {
    state;
    constructor(seed) {
        this.state = seed | 0;
        if (this.state === 0)
            this.state = 0x12345678;
    }
    nextU32() {
        let x = this.state | 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x | 0;
        return (x >>> 0);
    }
    nextFloat01() {
        return this.nextU32() / 0xffffffff;
    }
    range(lo, hi) {
        return lo + (hi - lo) * this.nextFloat01();
    }
}
export class Engine {
    config;
    rng;
    seq = 0;
    clockSec = 0;
    startedAtMs = Date.now();
    constructor(config) {
        this.config = config;
        this.rng = new XorShift32(config.seed);
    }
    tick(dtSec) {
        this.clockSec += dtSec;
        this.seq += 1;
    }
    getSnapshot() {
        return {
            matchId: this.config.matchId,
            seq: this.seq,
            serverTimeMs: Date.now() - this.startedAtMs,
            clockSec: this.clockSec,
            score: { A: 0, B: 0 },
            ball: {
                x: 450 + this.rng.range(-1, 1),
                y: 260 + this.rng.range(-1, 1),
                z: 0,
            },
            players: [],
        };
    }
}
export function createEngine(config) {
    return new Engine(config);
}
//# sourceMappingURL=index.js.map