import { MatchRegistryService } from './match-registry.service';
export declare class MatchQueryController {
    private readonly registry;
    constructor(registry: MatchRegistryService);
    get(matchId: string): import("./match-registry.service").MatchRecord;
}
