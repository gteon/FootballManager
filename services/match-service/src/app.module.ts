import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NatsModule } from './nats/nats.module';
import { LeagueMatchesController } from './matches/league-matches.controller';
import { MatchQueryController } from './matches/match-query.controller';
import { HealthController } from './matches/health.controller';
import { MatchRegistryService } from './matches/match-registry.service';
import { MatchOrchestrator } from './matches/match-orchestrator.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NatsModule],
  controllers: [
    LeagueMatchesController,
    MatchQueryController,
    HealthController,
  ],
  providers: [MatchRegistryService, MatchOrchestrator],
})
export class AppModule {}
