'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number; // 0-100
  status: 'queued' | 'uploading' | 'done';
};

export default function PdfUploader() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const timers = useRef<Record<string, number>>({}); // interval IDs

  const anyUploading = useMemo(
    () => items.some((i) => i.status === 'uploading'),
    [items]
  );

  const startSimulatedUpload = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: 'uploading', progress: 0 } : it
      )
    );

    const intId = window.setInterval(() => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const next = Math.min(it.progress + Math.random() * 18 + 7, 100);
          return {
            ...it,
            progress: next,
            status: next >= 100 ? 'done' : 'uploading',
          };
        })
      );
    }, 250);

    timers.current[id] = intId;
  };

  // stop timers for finished items
  const cleanupTimers = useCallback(() => {
    Object.entries(timers.current).forEach(([id, intId]) => {
      const item = items.find((i) => i.id === id);
      if (item && item.progress >= 100) {
        window.clearInterval(intId);
        delete timers.current[id];
      }
    });
  }, [items]);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted?.length) return;

    const newItems: UploadItem[] = accepted.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'queued',
    }));

    setItems((prev) => [...prev, ...newItems]);

    // start each simulated upload
    newItems.forEach((it) => startSimulatedUpload(it.id));
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: true, // we’ll trigger via button to match your UI
  });

  const handleClearAll = () => {
    // stop all timers
    Object.values(timers.current).forEach((intId) =>
      window.clearInterval(intId)
    );
    timers.current = {};
    setItems([]);
  };

  // keep timers tidy as items change
  cleanupTimers();

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
                      Clear
                      <X className='mr-2 h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center gap-3'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
                <p className='text-muted-foreground text-sm'>
                  Processing uploads…
                </p>
              </div>
            )}
          </div>

          {/* File list with progress BELOW the dropzone */}
          {items.length > 0 && (
            <div className='mt-6 space-y-3 text-left'>
              {items.map((it) => (
                <div
                  key={it.id}
                  className='rounded-md border bg-background p-3'
                >
                  <div className='mb-2 flex items-center justify-between'>
                    <p className='truncate font-medium text-foreground'>
                      {it.name}
                    </p>
                    <span className='text-xs text-muted-foreground'>
                      {it.status === 'done'
                        ? 'Completed'
                        : `${Math.round(it.progress)}%`}
                    </span>
                  </div>
                  <Progress value={it.progress} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
