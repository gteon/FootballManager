export class XorShift32 {
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
//# sourceMappingURL=rng.js.map