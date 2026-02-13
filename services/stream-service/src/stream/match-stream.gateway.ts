import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';

const JoinMatchSchema = z.object({
  matchId: z.string().min(1),
});

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class MatchStreamGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('joinMatch')
  joinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): { ok: true } {
    const parsed = JoinMatchSchema.parse(body);
    void client.join(this.roomFor(parsed.matchId));
    return { ok: true };
  }

  emitSnapshot(matchId: string, snapshot: unknown): void {
    this.server.to(this.roomFor(matchId)).emit('snapshot', snapshot);
  }

  private roomFor(matchId: string): string {
    return `match:${matchId}`;
  }
}
