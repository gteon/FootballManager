import { MatchRegistryService } from './match-registry.service';
export declare class MatchQueryController {
    private readonly registry;
    constructor(registry: MatchRegistryService);
    get(matchId: string): {
        found: boolean;
        match?: undefined;
    } | {
        found: boolean;
        match: import("./match-registry.service").MatchRecord;
    };
}
