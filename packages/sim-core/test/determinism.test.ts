import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/index';

describe('sim-core determinism', () => {
  it('produces identical snapshots with same seed', () => {
    const a = createEngine({ matchId: 'm1', seed: 123, engineVersion: 'v0' });
    const b = createEngine({ matchId: 'm1', seed: 123, engineVersion: 'v0' });

    for (let i = 0; i < 50; i++) {
      a.tick(1 / 60);
      b.tick(1 / 60);
      expect(a.getSnapshot()).toEqual(b.getSnapshot());
    }
  });
});
