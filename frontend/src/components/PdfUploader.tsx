'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function PdfUploader() {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];
    setFileName(file.name);
    setLoading(true);

    // simulate upload
    await new Promise((res) => setTimeout(res, 2000));
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  return (
    <div className='mx-auto w-full max-w-3xl space-y-6 text-center'>
      <Card className='shadow-sm border border-dashed border-muted-foreground/30 bg-muted/10'>
        <CardHeader>
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
            className={`mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-16 transition-all cursor-pointer
            ${isDragActive ? 'border-primary/70 bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />

            {!loading ? (
              <div className='flex flex-col items-center gap-3'>
                <Upload className='h-10 w-10 text-primary' />
                {fileName ? (
                  <p className='font-medium text-foreground'>{fileName}</p>
                ) : (
                  <>
                    <p className='text-lg font-semibold'>Upload your PDF</p>
                    <p className='text-sm text-muted-foreground'>
                      Drag and drop or select a file to begin
                    </p>
                    <Button className='mt-3' variant='default'>
                      Select PDF
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center gap-3'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
                <p className='text-muted-foreground text-sm'>
                  Processing PDF...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
