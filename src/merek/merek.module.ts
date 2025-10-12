import { Module } from '@nestjs/common';
import { MerekController } from './merek.controller';
import { MerekService } from './merek.service';

@Module({
  imports: [],
  controllers: [MerekController],
  providers: [MerekService],
})
export class MerekModule {}
