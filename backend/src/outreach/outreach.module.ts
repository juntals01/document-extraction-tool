import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutreachActivity } from './outreach-activity.entity';
import { OutreachService } from './outreach.service';

@Module({
  imports: [TypeOrmModule.forFeature([OutreachActivity])],
  providers: [OutreachService],
  exports: [OutreachService],
})
export class OutreachModule {}
