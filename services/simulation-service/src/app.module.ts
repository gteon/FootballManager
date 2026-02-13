import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NatsModule } from './nats/nats.module';
import { SimulationRunner } from './simulation/simulation.runner';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NatsModule],
  controllers: [AppController],
  providers: [AppService, SimulationRunner],
})
export class AppModule {}
