import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerekModule } from './merek/merek.module';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    MerekModule,
    RouterModule.register([
      {
        path: '/merek',
        module: MerekModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
