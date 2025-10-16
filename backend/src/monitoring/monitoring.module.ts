import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringMetric } from './monitoring-metric.entity';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([MonitoringMetric])],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
