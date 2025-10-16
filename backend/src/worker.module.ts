// backend/src/worker.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Core
import { DbModule } from './db/database.module';
import { QueueModule } from './queue/queue.module';
import { UploadModule } from './upload/upload.module';

// Services & processors
import { OpenAiService } from './ai/openai.service';
import { PdfExtractProcessor } from './worker/processor/pdf-extract.processor';
import { WorkerRunner } from './worker/worker.runner';

// Domain modules
import { BMPModule } from './bmp/bmp.module';
import { GeographicAreaModule } from './geographic-area/geographic-area.module';
import { GoalModule } from './goal/goal.module';
import { ImplementationModule } from './implementation/implementation.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { OutreachModule } from './outreach/outreach.module';
import { ProcessingModule } from './processing/processing.module';

// <-- add this import
import { ProcessedPdfImage } from './processing/processed-pdf-image.entity';

@Module({
  imports: [
    DbModule,
    QueueModule,
    UploadModule,
    ProcessingModule,
    GoalModule,
    BMPModule,
    ImplementationModule,
    MonitoringModule,
    OutreachModule,
    GeographicAreaModule,

    // <-- provide the repository token used by PdfExtractProcessor
    TypeOrmModule.forFeature([ProcessedPdfImage]),
  ],
  providers: [OpenAiService, PdfExtractProcessor, WorkerRunner],
})
export class WorkerModule {}
