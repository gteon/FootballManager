import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { LeagueService } from './league.service';

const JoinBodySchema = z.object({
  userId: z.string().min(1),
});

type JoinBody = z.infer<typeof JoinBodySchema>;

@Controller()
export class LeagueController {
  constructor(private readonly leagues: LeagueService) {}

  @Post('play/join')
  join(@Body() body: JoinBody) {
    const parsed = JoinBodySchema.parse(body);
    return this.leagues.join(parsed.userId);
  }

  @Get('play/status/:userId')
  status(@Param('userId') userId: string) {
    return this.leagues.getStatus(userId);
  }

  @Get('league/:leagueId')
  league(@Param('leagueId') leagueId: string) {
    return this.leagues.getLeague(leagueId);
  }
}
