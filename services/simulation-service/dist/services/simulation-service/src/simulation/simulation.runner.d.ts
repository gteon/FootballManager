import { OnModuleInit } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';
export declare class SimulationRunner implements OnModuleInit {
    private readonly nats;
    private readonly logger;
    private readonly engines;
    private readonly timers;
    constructor(nats: NatsService);
    onModuleInit(): void;
    private runLoop;
}
