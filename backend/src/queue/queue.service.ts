import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fsp } from 'fs';
import * as path from 'path';
import type { QueueJob, QueueJobName } from './queue.types';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly storageDir =
    process.env.STORAGE_DIR?.trim() || path.join(process.cwd(), 'storage');
  private readonly queueFile = path.join(this.storageDir, 'queue.json');

  private async ensureDir(dir: string) {
    await fsp.mkdir(dir, { recursive: true });
  }

  private async readQueue(): Promise<QueueJob[]> {
    await this.ensureDir(this.storageDir);
    try {
      const raw = await fsp.readFile(this.queueFile, 'utf8');
      const list = JSON.parse(raw) as QueueJob[];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  private async writeQueue(list: QueueJob[]) {
    await this.ensureDir(this.storageDir);
    await fsp.writeFile(this.queueFile, JSON.stringify(list, null, 2));
  }

  async enqueue(
    name: QueueJobName,
    payload: Record<string, any>,
  ): Promise<QueueJob> {
    const now = new Date().toISOString();
    const job: QueueJob = {
      id: randomUUID(),
      name,
      payload,
      status: 'pending',
      attempts: 0,
      enqueuedAt: now,
      updatedAt: now,
      error: null,
    };
    const list = await this.readQueue();
    list.push(job);
    await this.writeQueue(list);
    this.logger.log(`Enqueued job ${job.id} (${name})`);
    return job;
  }

  // Worker side: atomically claim the next pending job
  async claimNextPending(): Promise<QueueJob | null> {
    const list = await this.readQueue();
    const idx = list.findIndex((j) => j.status === 'pending');
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      status: 'processing',
      updatedAt: new Date().toISOString(),
    };
    await this.writeQueue(list);
    return list[idx];
  }

  async markCompleted(id: string) {
    const list = await this.readQueue();
    const idx = list.findIndex((j) => j.id === id);
    if (idx === -1) return;
    list[idx] = {
      ...list[idx],
      status: 'completed',
      updatedAt: new Date().toISOString(),
      error: null,
    };
    await this.writeQueue(list);
  }

  async markFailed(id: string, error: unknown) {
    const list = await this.readQueue();
    const idx = list.findIndex((j) => j.id === id);
    if (idx === -1) return;
    const attempts = (list[idx].attempts ?? 0) + 1;
    list[idx] = {
      ...list[idx],
      status: 'failed',
      attempts,
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
    await this.writeQueue(list);
  }
}
