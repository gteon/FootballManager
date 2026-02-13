export declare class XorShift32 {
    private state;
    constructor(seed: number);
    nextU32(): number;
    nextFloat01(): number;
    range(lo: number, hi: number): number;
    intRange(lo: number, hi: number): number;
    chance(p01: number): boolean;
}
//# sourceMappingURL=rng.d.ts.map