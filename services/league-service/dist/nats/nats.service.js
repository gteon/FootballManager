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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nats_1 = require("nats");
let NatsService = class NatsService {
    config;
    nc;
    jc = (0, nats_1.JSONCodec)();
    constructor(config) {
        this.config = config;
    }
    async onModuleInit() {
        const servers = this.config.get('NATS_URL') ?? 'nats://localhost:4222';
        this.nc = await (0, nats_1.connect)({ servers });
    }
    async onModuleDestroy() {
        await this.nc?.drain?.();
        await this.nc?.close?.();
        this.nc = undefined;
    }
    publishJson(subject, payload) {
        if (!this.nc)
            throw new Error('NATS not connected');
        this.nc.publish(subject, this.jc.encode(payload));
    }
    subscribeJson(subject, onMessage) {
        if (!this.nc)
            throw new Error('NATS not connected');
        void (async () => {
            const sub = this.nc.subscribe(subject);
            for await (const msg of sub) {
                const payload = this.jc.decode(msg.data);
                onMessage(payload);
            }
        })();
    }
};
exports.NatsService = NatsService;
exports.NatsService = NatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NatsService);
//# sourceMappingURL=nats.service.js.map