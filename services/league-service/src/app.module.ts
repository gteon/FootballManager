import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeagueModule } from './league/league.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LeagueModule],
})
export class AppModule {}
