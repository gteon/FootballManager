var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SimulationRunner_1;
import { Injectable, Logger } from '@nestjs/common';
import { createEngine } from "../../../../packages/sim-core/src/index.ts";
import { NatsService } from '../nats/nats.service';
let SimulationRunner = SimulationRunner_1 = class SimulationRunner {
    nats;
    logger = new Logger(SimulationRunner_1.name);
    engines = new Map();
    constructor(nats) {
        this.nats = nats;
    }
    onModuleInit() {
        this.nats.subscribeJson('evt.match.started', (evt) => {
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
    runLoop(matchId) {
        const engine = this.engines.get(matchId);
        if (!engine)
            return;
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
                const snap = e.getSnapshot();
                this.nats.publishJson('stream.match.snapshot', snap);
            }
        }, 1000 / tickHz);
    }
};
SimulationRunner = SimulationRunner_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [NatsService])
], SimulationRunner);
export { SimulationRunner };
//# sourceMappingURL=simulation.runner.js.map