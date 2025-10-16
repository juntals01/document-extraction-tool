import { Module } from '@nestjs/common';
import { DbModule } from './db/database.module';
import { QueueModule } from './queue/queue.module';
import { UploadModule } from './upload/upload.module';

// domain modules
import { BMPModule } from './bmp/bmp.module';
import { GeographicAreaModule } from './geographic-area/geographic-area.module';
import { GoalModule } from './goal/goal.module';
import { ImplementationModule } from './implementation/implementation.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { OutreachModule } from './outreach/outreach.module';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [
    DbModule,
    UploadModule,
    QueueModule,
    ProcessingModule,
    GoalModule,
    BMPModule,
    ImplementationModule,
    MonitoringModule,
    OutreachModule,
    GeographicAreaModule,
  ],
})
export class AppModule {}
