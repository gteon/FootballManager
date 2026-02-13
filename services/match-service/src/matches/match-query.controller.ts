import { Controller, Get, Param } from '@nestjs/common';
import { MatchRegistryService } from './match-registry.service';

@Controller('matches')
export class MatchQueryController {
  constructor(private readonly registry: MatchRegistryService) {}

  @Get(':matchId')
  get(@Param('matchId') matchId: string) {
    const match = this.registry.get(matchId);
    if (!match) return { found: false };
    return { found: true, match };
  }
}
