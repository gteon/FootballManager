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

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function toBase36(u32: number): string {
  return (u32 >>> 0).toString(36);
}

function deriveMatchId(cmd: CmdMatchCreate): string {
  const key = `${cmd.leagueId}|${cmd.round}|${cmd.aId}|${cmd.bId}`;
  const h = fnv1a32(key);
  return `m_${toBase36(h)}`;
}

function deriveSeed(cmd: CmdMatchCreate): number {
  if (typeof cmd.seed === 'number' && Number.isInteger(cmd.seed))
    return cmd.seed;
  const key = `seed|${cmd.leagueId}|${cmd.round}|${cmd.aId}|${cmd.bId}|${cmd.engineVersion}`;
  const h = fnv1a32(key);
  return h | 0 || 1;
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

      const matchId = deriveMatchId(cmd);
      const seed = deriveSeed(cmd);
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
