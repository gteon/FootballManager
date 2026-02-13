import { MatchRegistryService } from './match-registry.service';
export declare class LeagueMatchesController {
    private readonly registry;
    constructor(registry: MatchRegistryService);
    list(leagueId: string): {
        leagueId: string;
        matches: import("./match-registry.service").MatchRecord[];
    };
    listLive(leagueId: string): {
        leagueId: string;
        matches: {
            matchId: string;
            url: string;
        }[];
    };
}
