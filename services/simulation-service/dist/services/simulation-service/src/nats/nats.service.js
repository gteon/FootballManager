var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, JSONCodec } from 'nats';
let NatsService = class NatsService {
    config;
    nc;
    jc = JSONCodec();
    constructor(config) {
        this.config = config;
    }
    async onModuleInit() {
        const servers = this.config.get('NATS_URL') ?? 'nats://localhost:4222';
        this.nc = await connect({ servers });
    }
    async onModuleDestroy() {
        await this.nc?.drain?.();
        await this.nc?.close?.();
        this.nc = undefined;
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
    publishJson(subject, payload) {
        if (!this.nc)
            throw new Error('NATS not connected');
        this.nc.publish(subject, this.jc.encode(payload));
    }
};
NatsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], NatsService);
export { NatsService };
//# sourceMappingURL=nats.service.js.map