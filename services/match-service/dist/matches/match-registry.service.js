"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchRegistryService = void 0;
const common_1 = require("@nestjs/common");
let MatchRegistryService = class MatchRegistryService {
    matches = new Map();
    leagueToMatches = new Map();
    upsert(record) {
        this.matches.set(record.matchId, record);
        const set = this.leagueToMatches.get(record.leagueId) ?? new Set();
        set.add(record.matchId);
        this.leagueToMatches.set(record.leagueId, set);
    }
    get(matchId) {
        return this.matches.get(matchId);
    }
    listByLeague(leagueId) {
        const ids = this.leagueToMatches.get(leagueId);
        if (!ids)
            return [];
        return [...ids]
            .map((id) => this.matches.get(id))
            .filter((m) => Boolean(m));
    }
    listInProgressByLeague(leagueId) {
        return this.listByLeague(leagueId).filter((m) => m.status === 'in_progress');
    }
};
exports.MatchRegistryService = MatchRegistryService;
exports.MatchRegistryService = MatchRegistryService = __decorate([
    (0, common_1.Injectable)()
], MatchRegistryService);
//# sourceMappingURL=match-registry.service.js.map