"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nats_module_1 = require("./nats/nats.module");
const league_matches_controller_1 = require("./matches/league-matches.controller");
const match_query_controller_1 = require("./matches/match-query.controller");
const health_controller_1 = require("./matches/health.controller");
const match_registry_service_1 = require("./matches/match-registry.service");
const match_orchestrator_service_1 = require("./matches/match-orchestrator.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({ isGlobal: true }), nats_module_1.NatsModule],
        controllers: [league_matches_controller_1.LeagueMatchesController, match_query_controller_1.MatchQueryController, health_controller_1.HealthController],
        providers: [match_registry_service_1.MatchRegistryService, match_orchestrator_service_1.MatchOrchestrator],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map