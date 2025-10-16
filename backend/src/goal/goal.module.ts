import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './goal.entity';
import { GoalService } from './goal.service';

@Module({
  imports: [TypeOrmModule.forFeature([Goal])],
  providers: [GoalService],
  exports: [GoalService],
})
export class GoalModule {}
