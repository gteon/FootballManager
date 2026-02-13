import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NatsModule } from './nats/nats.module';
import { MatchStreamGateway } from './stream/match-stream.gateway';
import { SnapshotForwarder } from './stream/snapshot-forwarder.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NatsModule],
  controllers: [AppController],
  providers: [AppService, MatchStreamGateway, SnapshotForwarder],
})
export class AppModule {}
