import { NatsService } from '../nats/nats.service';
export type CreateMatchResult = {
    matchId: string;
    seed: number;
    engineVersion: string;
};
export declare class MatchesService {
    private readonly nats;
    constructor(nats: NatsService);
    createMatch(): CreateMatchResult;
    startMatch(matchId: string, seed: number, engineVersion: string): void;
}
