import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { PdfExtractProcessor } from './processor/pdf-extract.processor';

@Injectable()
export class WorkerRunner implements OnModuleInit {
  private readonly logger = new Logger(WorkerRunner.name);

  constructor(
    private readonly queue: QueueService,
    private readonly pdfExtract: PdfExtractProcessor,
  ) {}

  onModuleInit() {
    this.loop().catch((e) =>
      this.logger.error('Worker loop crashed', e as any),
    );
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async loop() {
    this.logger.log('Worker loop started');
    while (true) {
      const job = await this.queue.claimNextPending();
      if (!job) {
        await this.sleep(1000);
        continue;
      }

      this.logger.log(`▶️ Processing job ${job.id} (${job.name})`);
      try {
        if (job.name === 'extract_pdf') {
          const { uploadId } = job.payload as { uploadId: string };
          await this.pdfExtract.process(uploadId);
        } else {
          throw new Error(`Unknown job type: ${job.name}`);
        }
        await this.queue.markCompleted(job.id);
      } catch (err) {
        this.logger.error(`❌ Job ${job.id} failed`, err as any);
        await this.queue.markFailed(job.id, err);
      }
    }
  }
}
