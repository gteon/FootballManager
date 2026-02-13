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
exports.MatchStreamGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const zod_1 = require("zod");
const JoinMatchSchema = zod_1.z.object({
    matchId: zod_1.z.string().min(1),
});
let MatchStreamGateway = class MatchStreamGateway {
    server;
    joinMatch(client, body) {
        const parsed = JoinMatchSchema.parse(body);
        void client.join(this.roomFor(parsed.matchId));
        return { ok: true };
    }
    emitSnapshot(matchId, snapshot) {
        this.server.to(this.roomFor(matchId)).emit('snapshot', snapshot);
    }
    roomFor(matchId) {
        return `match:${matchId}`;
    }
};
exports.MatchStreamGateway = MatchStreamGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MatchStreamGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinMatch'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Object)
], MatchStreamGateway.prototype, "joinMatch", null);
exports.MatchStreamGateway = MatchStreamGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: true, credentials: true } })
], MatchStreamGateway);
//# sourceMappingURL=match-stream.gateway.js.map