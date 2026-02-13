import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';
import { MatchStreamGateway } from './match-stream.gateway';

@Injectable()
export class SnapshotForwarder implements OnModuleInit {
  private readonly logger = new Logger(SnapshotForwarder.name);

  constructor(
    private readonly nats: NatsService,
    private readonly gateway: MatchStreamGateway,
  ) {}

  onModuleInit(): void {
    this.nats.subscribeJson('stream.match.snapshot', (snap: any) => {
      this.gateway.emitSnapshot(String(snap.matchId), snap);
    });

    this.logger.log('Forwarding NATS snapshots -> WebSocket');
  }
}
