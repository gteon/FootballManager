export type Vec2 = { x: number; y: number };

export type TeamId = 'A' | 'B';

export type PlayerSnapshot = {
  id: string;
  team: TeamId;
  role: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: string;
  hasBall: boolean;
};

export type MatchSnapshot = {
  matchId: string;
  seq: number;
  serverTimeMs: number;
  clockSec: number;
  score: { A: number; B: number };
  ball: { x: number; y: number; z: number };
  players: PlayerSnapshot[];
};

export type EngineConfig = {
  matchId: string;
  seed: number;
  engineVersion: string;
};

class XorShift32 {
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

export class Engine {
  private readonly rng: XorShift32;
  private seq = 0;
  private clockSec = 0;
  private readonly startedAtMs = Date.now();

  constructor(private readonly config: EngineConfig) {
    this.rng = new XorShift32(config.seed);
  }

  tick(dtSec: number): void {
    this.clockSec += dtSec;
    this.seq += 1;
  }

  getSnapshot(): MatchSnapshot {
    // Placeholder minimal snapshot. We will replace by the real ported engine next.
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

export function createEngine(config: EngineConfig): Engine {
  return new Engine(config);
}
