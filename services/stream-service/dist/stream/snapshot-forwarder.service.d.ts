import { OnModuleInit } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';
import { MatchStreamGateway } from './match-stream.gateway';
export declare class SnapshotForwarder implements OnModuleInit {
    private readonly nats;
    private readonly gateway;
    private readonly logger;
    constructor(nats: NatsService, gateway: MatchStreamGateway);
    onModuleInit(): void;
}
