'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadItem, UploadRecord } from '@/interfaces/upload';
import { axiosClient } from '@/lib/api';
import { BarChart3, Eye, Loader2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function formatBytes(n: number) {
  if (!n && n !== 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default function PdfUploader() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef<Record<string, AbortController>>({});

  const anyUploading = useMemo(
    () => items.some((i) => i.status === 'uploading'),
    [items]
  );

  const uploadOne = useCallback(async (it: UploadItem) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === it.id ? { ...p, status: 'uploading', progress: 0 } : p
      )
    );

    const form = new FormData();
    form.append('files', it.file);

    const ctrl = new AbortController();
    controllers.current[it.id] = ctrl;

    try {
      const res = await axiosClient.post<UploadRecord[]>('/upload', form, {
        signal: ctrl.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
          setItems((prev) =>
            prev.map((p) => (p.id === it.id ? { ...p, progress: pct } : p))
          );
        },
      });

      const payload = Array.isArray(res.data)
        ? res.data[0]
        : (res.data as unknown as UploadRecord);

      setItems((prev) =>
        prev.map((p) =>
          p.id === it.id
            ? { ...p, status: 'done', progress: 100, result: payload }
            : p
        )
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === it.id
            ? {
                ...p,
                status: 'error',
                error:
                  err?.response?.data?.message ||
                  err?.message ||
                  'Upload failed',
              }
            : p
        )
      );
    } finally {
      delete controllers.current[it.id];
    }
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted?.length) return;

      const newItems: UploadItem[] = accepted.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        file: f,
        name: f.name,
        size: f.size,
        progress: 0,
        status: 'queued',
      }));

      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach((it) => uploadOne(it));
    },
    [uploadOne]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: true,
  });

  const handleClearAll = () => {
    Object.values(controllers.current).forEach((c) => c.abort());
    controllers.current = {};
    setItems([]);
  };

  return (
    <div className='mx-auto w-full max-w-3xl space-y-6 text-center'>
      <Card className='shadow-sm border border-dashed border-muted-foreground/30 bg-muted/10'>
        <CardHeader className='space-y-2'>
          <CardTitle className='text-3xl font-bold text-foreground'>
            PDF Data Extractor
          </CardTitle>
          <p className='text-muted-foreground text-sm'>
            Upload any PDF to extract relevant data and patterns. Query specific
            information from your documents with ease.
          </p>
        </CardHeader>

        <CardContent>
          <div
            {...getRootProps()}
            className={`mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-16 transition-all cursor-pointer
            ${isDragActive ? 'border-primary/70 bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            {!anyUploading ? (
              <div className='flex flex-col items-center gap-3'>
                <Upload className='h-10 w-10 text-primary' />
                <p className='text-lg font-semibold'>
                  Upload your PDF{items.length !== 1 ? 's' : ''}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Drag and drop or select file(s) to begin
                </p>
                <div className='mt-3 flex items-center gap-2'>
                  <Button onClick={open}>Select PDF</Button>
                  {items.length > 0 && (
                    <Button variant='destructive' onClick={handleClearAll}>
                      <X className='mr-2 h-4 w-4' />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center gap-3'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
                <p className='text-muted-foreground text-sm'>Uploading…</p>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className='mt-6 space-y-3 text-left'>
              {items.map((it) => (
                <div
                  key={it.id}
                  className='rounded-md border bg-background p-3'
                >
                  <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium text-foreground'>
                        {it.name}{' '}
                        <span className='ml-2 text-xs text-muted-foreground'>
                          ({formatBytes(it.size)})
                        </span>
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      {it.result && (
                        <>
                          <Link
                            href={`/pdf/${it.result.slug}`}
                            className='inline-flex items-center text-sm underline'
                          >
                            <Eye className='mr-1 h-4 w-4' />
                            View
                          </Link>
                          <Link
                            href={`/pdf/${it.result.slug}/stats`}
                            className='inline-flex items-center text-sm underline'
                          >
                            <BarChart3 className='mr-1 h-4 w-4' />
                            Stats
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  <Progress value={it.progress} />
                  {it.status === 'error' && (
                    <p className='mt-1 text-sm text-red-500'>{it.error}</p>
                  )}
                  {it.status === 'done' && it.result && (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Saved as {it.result.storedName} • slug: {it.result.slug}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
