import { Server, Socket } from 'socket.io';
export declare class MatchStreamGateway {
    server: Server;
    joinMatch(client: Socket, body: unknown): {
        ok: true;
    };
    emitSnapshot(matchId: string, snapshot: unknown): void;
    private roomFor;
}
