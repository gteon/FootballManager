import { LeagueService } from './league.service';
export declare class HealthController {
    private readonly leagueService;
    constructor(leagueService: LeagueService);
    health(): {
        status: string;
        service: string;
        openLobbiesCount: number;
    };
}
