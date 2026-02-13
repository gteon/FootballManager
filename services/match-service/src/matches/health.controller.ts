import { Controller, Get } from '@nestjs/common';
import { MatchRegistryService } from './match-registry.service';

@Controller('healthz')
export class HealthController {
  constructor(private readonly registry: MatchRegistryService) {}

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'match-service',
      matchesCount: this.registry.count(),
    };
  }
}
