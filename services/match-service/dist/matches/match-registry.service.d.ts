export type MatchStatus = 'created' | 'in_progress' | 'finished';
export type MatchRecord = {
    matchId: string;
    leagueId: string;
    round: number;
    aId: string;
    bId: string;
    seed: number;
    engineVersion: string;
    status: MatchStatus;
    createdAtMs: number;
    startedAtMs?: number;
    finishedAtMs?: number;
};
export declare class MatchRegistryService {
    private readonly matches;
    private readonly leagueToMatches;
    upsert(record: MatchRecord): void;
    get(matchId: string): MatchRecord | undefined;
    listByLeague(leagueId: string): MatchRecord[];
    listInProgressByLeague(leagueId: string): MatchRecord[];
}
