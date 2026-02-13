import { Controller, Get } from '@nestjs/common';
import { LeagueService } from './league.service';

@Controller('healthz')
export class HealthController {
  constructor(private readonly leagueService: LeagueService) {}

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'league-service',
      openLobbiesCount: this.leagueService.openLobbiesCount(),
    };
  }
}
