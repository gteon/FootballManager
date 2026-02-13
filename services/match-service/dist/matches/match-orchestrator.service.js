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
var MatchOrchestrator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchOrchestrator = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const nats_service_1 = require("../nats/nats.service");
const match_registry_service_1 = require("./match-registry.service");
const CmdMatchCreateSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
    round: zod_1.z.number().int().positive(),
    aId: zod_1.z.string().min(1),
    bId: zod_1.z.string().min(1),
    engineVersion: zod_1.z.string().min(1).default('v0'),
    seed: zod_1.z.number().int().optional(),
});
function makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}
let MatchOrchestrator = MatchOrchestrator_1 = class MatchOrchestrator {
    nats;
    registry;
    logger = new common_1.Logger(MatchOrchestrator_1.name);
    constructor(nats, registry) {
        this.nats = nats;
        this.registry = registry;
    }
    onModuleInit() {
        this.nats.subscribeJson('cmd.match.create', (raw) => {
            const cmd = CmdMatchCreateSchema.parse(raw);
            const matchId = makeId('m');
            const seed = cmd.seed ?? Math.floor(Math.random() * 2_000_000_000) - 1_000_000_000;
            const engineVersion = cmd.engineVersion;
            this.registry.upsert({
                matchId,
                leagueId: cmd.leagueId,
                round: cmd.round,
                aId: cmd.aId,
                bId: cmd.bId,
                seed,
                engineVersion,
                status: 'in_progress',
                createdAtMs: Date.now(),
                startedAtMs: Date.now(),
            });
            this.logger.log(`Created match ${matchId} league=${cmd.leagueId} round=${cmd.round} ${cmd.aId} vs ${cmd.bId}`);
            this.nats.publishJson('evt.match.created', {
                matchId,
                leagueId: cmd.leagueId,
                round: cmd.round,
                aId: cmd.aId,
                bId: cmd.bId,
                seed,
                engineVersion,
            });
            this.nats.publishJson('evt.match.started', {
                matchId,
                seed,
                engineVersion,
            });
        });
        this.logger.log('Listening cmd.match.create');
    }
};
exports.MatchOrchestrator = MatchOrchestrator;
exports.MatchOrchestrator = MatchOrchestrator = MatchOrchestrator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nats_service_1.NatsService,
        match_registry_service_1.MatchRegistryService])
], MatchOrchestrator);
//# sourceMappingURL=match-orchestrator.service.js.map