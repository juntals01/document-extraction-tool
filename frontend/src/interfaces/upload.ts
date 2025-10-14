export interface UploadRecord {
  id: string;
  originalName: string;
  slug: string;
  storedName: string;
  path: string;
  size: string | number;
  mimetype: string;
  createdAt: string;
}

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  result?: UploadRecord;
  error?: string;
}
