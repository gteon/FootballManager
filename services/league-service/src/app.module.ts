import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeagueModule } from './league/league.module';
import { NatsModule } from './nats/nats.module';
import { HealthController } from './league/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NatsModule, LeagueModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
