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
exports.LeagueController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const league_service_1 = require("./league.service");
const JoinBodySchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
});
let LeagueController = class LeagueController {
    leagues;
    constructor(leagues) {
        this.leagues = leagues;
    }
    join(body) {
        const parsed = JoinBodySchema.parse(body);
        return this.leagues.join(parsed.userId);
    }
    status(userId) {
        return this.leagues.getStatus(userId);
    }
    league(leagueId) {
        return this.leagues.getLeague(leagueId);
    }
};
exports.LeagueController = LeagueController;
__decorate([
    (0, common_1.Post)('play/join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeagueController.prototype, "join", null);
__decorate([
    (0, common_1.Get)('play/status/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeagueController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('league/:leagueId'),
    __param(0, (0, common_1.Param)('leagueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeagueController.prototype, "league", null);
exports.LeagueController = LeagueController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [league_service_1.LeagueService])
], LeagueController);
//# sourceMappingURL=league.controller.js.map