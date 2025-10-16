// backend/src/processing/utils/pdfjs.ts
import { createRequire } from 'module';
import * as path from 'path';

// Resolve package paths whether we're CJS or ESM at runtime
function resolveFromPkg(id: string) {
  try {
    // @ts-ignore - available when transpiled to CJS
    return require.resolve(id);
  } catch {
    const req = createRequire(__filename);
    return req.resolve(id);
  }
}

/**
 * Node-safe PDF.js loader.
 * - Prefers legacy ESM build for Node
 * - Injects standardFontDataUrl
 * - Disables font-face & eval (no Canvas needed)
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
      pdfjs = mod?.default ?? mod;
      if (pdfjs?.getDocument) break;
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

  // In Node, no web worker needed
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = undefined;
  }

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
