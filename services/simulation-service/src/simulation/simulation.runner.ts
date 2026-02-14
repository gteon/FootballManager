import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createEngine, FootballEngine, type EngineSnapshot } from '@footballmanager/sim-core';
import type {
  MatchFinishedEvent,
  MatchStartedEvent,
  MatchSnapshot,
} from '@footballmanager/contracts';
import { NatsService } from '../nats/nats.service';

@Injectable()
export class SimulationRunner implements OnModuleInit {
  private readonly logger = new Logger(SimulationRunner.name);
  private readonly engines = new Map<string, FootballEngine>();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly nats: NatsService) {}

  onModuleInit(): void {
    this.nats.subscribeJson<MatchStartedEvent>('evt.match.started', (evt) => {
      this.logger.log(`Starting match ${evt.matchId}`);

      if (this.engines.has(evt.matchId)) {
        this.logger.warn(`Match ${evt.matchId} already running; ignoring`);
        return;
      }

      const engine = createEngine({
        matchId: evt.matchId,
        seed: evt.seed,
        engineVersion: evt.engineVersion,
      });

      this.engines.set(evt.matchId, engine);
      this.runLoop(evt.matchId);
    });
  }

  private runLoop(matchId: string): void {
    const engine = this.engines.get(matchId);
    if (!engine) return;

    const tickHz = 60;
    const snapshotHz = 10;
    const dt = 1 / tickHz;
    const snapshotEveryTicks = Math.floor(tickHz / snapshotHz);

    let tick = 0;

    const interval = setInterval(() => {
      const e = this.engines.get(matchId);
      if (!e) {
        clearInterval(interval);
        return;
      }

      e.tick(dt);
      tick += 1;

      if (tick % snapshotEveryTicks === 0) {
        const engineSnap: EngineSnapshot = e.getSnapshot();
        
        // Map EngineSnapshot to MatchSnapshot (contracts)
        const snap: MatchSnapshot = {
          matchId: engineSnap.matchId,
          seq: engineSnap.seq,
          serverTimeMs: engineSnap.serverTimeMs,
          clockSec: engineSnap.clockSec,
          score: engineSnap.score,
          ball: {
            x: engineSnap.ball.x,
            y: engineSnap.ball.y,
            z: engineSnap.ball.z,
            vx: engineSnap.ball.vx,
            vy: engineSnap.ball.vy,
            vz: engineSnap.ball.vz,
          },
          players: engineSnap.players.map(p => ({
            id: p.id,
            team: p.team,
            role: p.role,
            x: p.x,
            y: p.y,
            vx: p.vx,
            vy: p.vy,
            state: p.state,
            hasBall: p.hasBall,
          })),
          events: engineSnap.events,
        };
        
        this.nats.publishJson('stream.match.snapshot', snap);

        const fullTime = engineSnap.events.find((ev) => ev.type === 'FULL_TIME');
        if (fullTime) {
          const score = engineSnap.score;
          const winner: MatchFinishedEvent['winner'] =
            score.A > score.B ? 'A' : score.B > score.A ? 'B' : 'DRAW';

          this.nats.publishJson('evt.match.finished', {
            matchId: engineSnap.matchId,
            score,
            winner,
            finishedAtMs: Date.now(),
          } satisfies MatchFinishedEvent);

          const t = this.timers.get(matchId);
          if (t) clearInterval(t);
          this.timers.delete(matchId);
          this.engines.delete(matchId);
          this.logger.log(`Finished match ${matchId} (${score.A}-${score.B})`);
        }
      }
    }, 1000 / tickHz);

    const prev = this.timers.get(matchId);
    if (prev) clearInterval(prev);
    this.timers.set(matchId, interval);
  }
}
