import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class WorkerRunner implements OnModuleInit {
  private readonly logger = new Logger(WorkerRunner.name);

  constructor(
    private readonly queue: QueueService,
    private readonly uploads: UploadService,
  ) {}

  onModuleInit() {
    this.loop().catch((e) =>
      this.logger.error('Worker loop crashed', e as any),
    );
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async processExtractPdf(payload: { uploadId: string }) {
    const { uploadId } = payload;
    const upload = await this.uploads.assertUploadExists(uploadId);
    await this.sleep(300); // TODO real extraction
    this.logger.log(`Processed upload ${upload.id} (${upload.slug})`);
  }

  private async loop() {
    this.logger.log('Worker loop started');
    // simple polling loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const job = await this.queue.claimNextPending();
      if (!job) {
        await this.sleep(1000);
        continue;
      }
      try {
        if (job.name === 'extract_pdf') {
          await this.processExtractPdf(job.payload as any);
        } else {
          throw new Error(`Unknown job: ${job.name}`);
        }
        await this.queue.markCompleted(job.id);
      } catch (err) {
        this.logger.error(`Job ${job.id} failed`, err as any);
        await this.queue.markFailed(job.id, err);
      }
    }
  }
}
