import { OnModuleInit } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';
import { MatchRegistryService } from './match-registry.service';
export declare class MatchOrchestrator implements OnModuleInit {
    private readonly nats;
    private readonly registry;
    private readonly logger;
    constructor(nats: NatsService, registry: MatchRegistryService);
    onModuleInit(): void;
}
