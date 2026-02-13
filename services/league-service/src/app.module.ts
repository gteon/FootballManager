import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeagueModule } from './league/league.module';
import { NatsModule } from './nats/nats.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NatsModule, LeagueModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
