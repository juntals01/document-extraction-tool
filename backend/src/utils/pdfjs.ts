// backend/src/processing/utils/pdfjs.ts
// Node-safe ESM resolver for pdf.js (prefers legacy build for Node)

export async function getPdfjs(): Promise<any> {
  const specs = [
    'pdfjs-dist/legacy/build/pdf.mjs',
    'pdfjs-dist/build/pdf.mjs',
    'pdfjs-dist',
  ];
  for (const s of specs) {
    try {
      const mod: any = await import(s);
      const lib = mod?.default ?? mod;
      if (lib?.getDocument) return lib;
    } catch {}
  }
  throw new Error(
    "Cannot resolve 'pdfjs-dist'. Install it with `npm i -w backend pdfjs-dist`.",
  );
}
