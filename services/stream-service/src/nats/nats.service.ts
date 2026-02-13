import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, JSONCodec } from 'nats';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private nc: any;
  private readonly jc: any = JSONCodec();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const servers =
      this.config.get<string>('NATS_URL') ?? 'nats://localhost:4222';
    this.nc = await connect({ servers });
  }

  async onModuleDestroy(): Promise<void> {
    await this.nc?.drain?.();
    await this.nc?.close?.();
    this.nc = undefined;
  }

  subscribeJson<T = unknown>(
    subject: string,
    onMessage: (payload: T) => void,
  ): void {
    if (!this.nc) throw new Error('NATS not connected');

    void (async () => {
      const sub = this.nc.subscribe(subject);
      for await (const msg of sub) {
        const payload = this.jc.decode(msg.data) as T;
        onMessage(payload);
      }
    })();
  }
}
