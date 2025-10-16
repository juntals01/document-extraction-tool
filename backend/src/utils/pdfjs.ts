// backend/src/utils/pdfjs.ts  (or your current path)
import { createRequire } from 'module';
import * as path from 'path';

function resolveFromPkg(id: string) {
  try {
    // @ts-ignore - available when compiled to CJS
    return require.resolve(id);
  } catch {
    const req = createRequire(__filename);
    return req.resolve(id);
  }
}

/**
 * Node-safe PDF.js loader.
 * - Uses legacy ESM build (best for Node)
 * - Injects standardFontDataUrl
 * - Disables browser-only features (no Canvas, no eval)
 * - Does NOT set workerSrc in Node (avoids the error)
 */
export async function getPdfjs(): Promise<{
  getDocument: (src: any) => any;
  pdfjs: any;
}> {
  const specs = ['pdfjs-dist/legacy/build/pdf.mjs', 'pdfjs-dist/build/pdf.mjs'];

  let pdfjs: any = null;
  for (const s of specs) {
    try {
      const mod: any = await import(s);
      const lib = mod?.default ?? mod;
      if (lib?.getDocument) {
        pdfjs = lib;
        break;
      }
    } catch {
      /* try next */
    }
  }
  if (!pdfjs) {
    throw new Error(
      "Cannot resolve 'pdfjs-dist'. Install it with `npm i -w backend pdfjs-dist`.",
    );
  }

  // Path to bundled standard fonts inside pdfjs-dist
  const pkgPath = resolveFromPkg('pdfjs-dist/package.json');
  const stdFonts = path.resolve(path.dirname(pkgPath), 'standard_fonts');

  // Do NOT touch workerSrc in Node — that's what triggered your error.

  const getDocument = (src: any) =>
    pdfjs.getDocument({
      ...src,
      standardFontDataUrl: stdFonts,
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: true,
    });

  return { getDocument, pdfjs };
}
