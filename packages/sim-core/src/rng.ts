export class XorShift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
    if (this.state === 0) this.state = 0x12345678;
  }

  nextU32(): number {
    let x = this.state | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x | 0;
    return (x >>> 0) as number;
  }

  nextFloat01(): number {
    return this.nextU32() / 0xffffffff;
  }

  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.nextFloat01();
  }
}
