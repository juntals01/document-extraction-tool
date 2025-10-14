export type QueueJobName = 'extract_pdf';

export type QueueJob = {
  id: string;
  name: QueueJobName;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  error?: string | null;
  enqueuedAt: string; // ISO
  updatedAt: string; // ISO
};
