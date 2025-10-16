import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImplementationActivity } from './implementation-activity.entity';
import { ImplementationService } from './implementation.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImplementationActivity])],
  providers: [ImplementationService],
  exports: [ImplementationService],
})
export class ImplementationModule {}
