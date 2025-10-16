import { Module } from '@nestjs/common';
import { OpenAiService } from './ai/openai.service';
import { DbModule } from './db/database.module';
import { ProcessingModule } from './processing/processing.module';
import { QueueModule } from './queue/queue.module';
import { UploadModule } from './upload/upload.module';
import { PdfExtractProcessor } from './worker/processor/pdf-extract.processor';
import { WorkerRunner } from './worker/worker.runner';

@Module({
  imports: [DbModule, UploadModule, QueueModule, ProcessingModule],
  providers: [WorkerRunner, OpenAiService, PdfExtractProcessor],
})
export class WorkerModule {}
