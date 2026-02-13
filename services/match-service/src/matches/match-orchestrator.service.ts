import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { NatsService } from '../nats/nats.service';
import { MatchRegistryService } from './match-registry.service';

const CmdMatchCreateSchema = z.object({
  leagueId: z.string().min(1),
  round: z.number().int().positive(),
  aId: z.string().min(1),
  bId: z.string().min(1),
  engineVersion: z.string().min(1).default('v0'),
  seed: z.number().int().optional(),
});

type CmdMatchCreate = z.infer<typeof CmdMatchCreateSchema>;

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

@Injectable()
export class MatchOrchestrator implements OnModuleInit {
  private readonly logger = new Logger(MatchOrchestrator.name);

  constructor(
    private readonly nats: NatsService,
    private readonly registry: MatchRegistryService,
  ) {}

  onModuleInit(): void {
    this.nats.subscribeJson<CmdMatchCreate>('cmd.match.create', (raw) => {
      const cmd = CmdMatchCreateSchema.parse(raw);

      const matchId = makeId('m');
      const seed =
        cmd.seed ?? Math.floor(Math.random() * 2_000_000_000) - 1_000_000_000;
      const engineVersion = cmd.engineVersion;

      this.registry.upsert({
        matchId,
        leagueId: cmd.leagueId,
        round: cmd.round,
        aId: cmd.aId,
        bId: cmd.bId,
        seed,
        engineVersion,
        status: 'in_progress',
        createdAtMs: Date.now(),
        startedAtMs: Date.now(),
      });

      this.logger.log(
        `Created match ${matchId} league=${cmd.leagueId} round=${cmd.round} ${cmd.aId} vs ${cmd.bId}`,
      );

      this.nats.publishJson('evt.match.created', {
        matchId,
        leagueId: cmd.leagueId,
        round: cmd.round,
        aId: cmd.aId,
        bId: cmd.bId,
        seed,
        engineVersion,
      });

      this.nats.publishJson('evt.match.started', {
        matchId,
        seed,
        engineVersion,
      });
    });

    this.logger.log('Listening cmd.match.create');
  }
}
