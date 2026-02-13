"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueMatchesController = void 0;
const common_1 = require("@nestjs/common");
const match_registry_service_1 = require("./match-registry.service");
let LeagueMatchesController = class LeagueMatchesController {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    list(leagueId) {
        return {
            leagueId,
            matches: this.registry.listByLeague(leagueId),
        };
    }
    listLive(leagueId) {
        const matches = this.registry.listInProgressByLeague(leagueId);
        return {
            leagueId,
            matches: matches.map((m) => ({
                matchId: m.matchId,
                url: `http://localhost:5173/match/${m.matchId}`,
            })),
        };
    }
};
exports.LeagueMatchesController = LeagueMatchesController;
__decorate([
    (0, common_1.Get)(':leagueId/matches'),
    __param(0, (0, common_1.Param)('leagueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeagueMatchesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':leagueId/matches/live'),
    __param(0, (0, common_1.Param)('leagueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeagueMatchesController.prototype, "listLive", null);
exports.LeagueMatchesController = LeagueMatchesController = __decorate([
    (0, common_1.Controller)('leagues'),
    __metadata("design:paramtypes", [match_registry_service_1.MatchRegistryService])
], LeagueMatchesController);
//# sourceMappingURL=league-matches.controller.js.map