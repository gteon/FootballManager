import { Body, Controller, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { MatchesService } from './matches.service';

const StartMatchBodySchema = z.object({
  seed: z.number().int(),
  engineVersion: z.string().min(1),
});

type StartMatchBody = z.infer<typeof StartMatchBodySchema>;

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Post()
  create() {
    return this.matches.createMatch();
  }

  @Post(':matchId/start')
  start(@Param('matchId') matchId: string, @Body() body: StartMatchBody) {
    const parsed = StartMatchBodySchema.parse(body);
    this.matches.startMatch(matchId, parsed.seed, parsed.engineVersion);
    return { ok: true };
  }
}
