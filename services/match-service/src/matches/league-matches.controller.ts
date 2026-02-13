import { Controller, Get, Param } from '@nestjs/common';
import { MatchRegistryService } from './match-registry.service';

@Controller('leagues')
export class LeagueMatchesController {
  constructor(private readonly registry: MatchRegistryService) {}

  @Get(':leagueId/matches')
  list(@Param('leagueId') leagueId: string) {
    return {
      leagueId,
      matches: this.registry.listByLeague(leagueId),
    };
  }

  @Get(':leagueId/matches/live')
  listLive(@Param('leagueId') leagueId: string) {
    const matches = this.registry.listInProgressByLeague(leagueId);
    return {
      leagueId,
      matches: matches.map((m) => ({
        matchId: m.matchId,
        url: `http://localhost:5173/match/${m.matchId}`,
      })),
    };
  }
}
