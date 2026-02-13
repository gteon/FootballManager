import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { MatchRegistryService } from './match-registry.service';

@Controller('matches')
export class MatchQueryController {
  constructor(private readonly registry: MatchRegistryService) {}

  @Get(':matchId')
  get(@Param('matchId') matchId: string) {
    const match = this.registry.get(matchId);
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    return match;
  }
}
