import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class NatsService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private nc;
    private readonly jc;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    subscribeJson<T = unknown>(subject: string, onMessage: (payload: T) => void): void;
}
