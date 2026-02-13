import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NatsModule } from './nats/nats.module';
import { MatchesController } from './matches/matches.controller';
import { MatchesService } from './matches/matches.service';
import { LeagueMatchesController } from './matches/league-matches.controller';
import { MatchQueryController } from './matches/match-query.controller';
import { MatchRegistryService } from './matches/match-registry.service';
import { MatchOrchestrator } from './matches/match-orchestrator.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NatsModule],
  controllers: [
    AppController,
    MatchesController,
    LeagueMatchesController,
    MatchQueryController,
  ],
  providers: [
    AppService,
    MatchesService,
    MatchRegistryService,
    MatchOrchestrator,
  ],
})
export class AppModule {}
