// backend/src/processing/utils/pdf-table-extractor.ts

export async function getPdfTableExtractor(): Promise<
  (
    src: string,
    onSuccess: (res: any) => void,
    onError: (err: any) => void,
  ) => void
> {
  try {
    const mod: any = await import('pdf-table-extractor' as any);
    const fn = (mod?.default ?? mod) as any;
    if (typeof fn === 'function') return fn;
  } catch {}
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const req = Function('return require')() as NodeRequire;
  const fn = req('pdf-table-extractor');
  if (typeof fn === 'function') return fn;

  throw new Error(
    "Cannot resolve 'pdf-table-extractor'. Install with `npm i -w backend pdf-table-extractor`.",
  );
}
