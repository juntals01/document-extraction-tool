import { Module } from '@nestjs/common';
import { DbModule } from './db/database.module';
import { QueueModule } from './queue/queue.module';
import { UploadModule } from './upload/upload.module';
import { WorkerRunner } from './worker/worker.runner';

@Module({
  imports: [DbModule, UploadModule, QueueModule],
  providers: [WorkerRunner],
})
export class WorkerModule {}
