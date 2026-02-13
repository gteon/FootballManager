import { MatchRegistryService } from './match-registry.service';
export declare class HealthController {
    private readonly registry;
    constructor(registry: MatchRegistryService);
    health(): {
        status: string;
        service: string;
        matchesCount: number;
    };
}
