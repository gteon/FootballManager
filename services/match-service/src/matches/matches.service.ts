import { Injectable } from '@nestjs/common';
import { NatsService } from '../nats/nats.service';

export type CreateMatchResult = {
  matchId: string;
  seed: number;
  engineVersion: string;
};

@Injectable()
export class MatchesService {
  constructor(private readonly nats: NatsService) {}

  createMatch(): CreateMatchResult {
    const matchId = `m_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const seed = Math.floor(Math.random() * 2_000_000_000) - 1_000_000_000;
    const engineVersion = 'v0';

    return { matchId, seed, engineVersion };
  }

  startMatch(matchId: string, seed: number, engineVersion: string): void {
    this.nats.publishJson('evt.match.started', {
      matchId,
      seed,
      engineVersion,
    });
  }
}
