// backend/src/processing/utils/image-extract.ts
import { PDFDict, PDFDocument, PDFName, PDFStream } from 'pdf-lib';

type ExtractedImage = {
  idx: number;
  ext: 'jpg' | 'jp2';
  bytes: Uint8Array;
};

function getDict(obj: any): PDFDict | undefined {
  if (!obj) return undefined;
  if (obj instanceof PDFDict) return obj;
  if (obj.dict instanceof PDFDict) return obj.dict;
  return undefined;
}

function getFilters(dict: PDFDict | undefined): string[] {
  if (!dict) return [];
  const f = dict.get(PDFName.of('Filter')) as any;
  const toName = (v: any) => (v?.name ? `/${v.name}` : String(v));
  if (!f) return [];
  if (Array.isArray((f as any)?.array)) return (f as any).array.map(toName);
  return [toName(f)];
}

function tryGetStreamBytes(obj: any): Uint8Array | null {
  try {
    if (
      obj instanceof PDFStream &&
      typeof (obj as any).getContents === 'function'
    ) {
      return (obj as any).getContents() as Uint8Array;
    }
    if (typeof obj?.getContents === 'function')
      return obj.getContents() as Uint8Array;
  } catch {}
  return null;
}

/**
 * Pure extractor: returns JPEG/JPX image streams for a given page.
 * Caller is responsible for writing files and persisting DB rows.
 */
export function extractImagesFromPage(
  originalDoc: PDFDocument,
  pageIndex0: number,
): ExtractedImage[] {
  const out: ExtractedImage[] = [];

  const page = originalDoc.getPage(pageIndex0) as any;
  const node = page.node;
  const Resources = node.Resources?.();
  if (!Resources) return out;

  const xObjDict = Resources.lookup(PDFName.of('XObject')) as
    | PDFDict
    | undefined;
  if (!xObjDict) return out;

  let idx = 0;
  for (const key of xObjDict.keys()) {
    const obj = xObjDict.lookup(key) as any;
    if (!obj) continue;

    const dict = getDict(obj);
    if (!dict) continue;

    const subtype = dict.get(PDFName.of('Subtype')) as any;
    if (String(subtype) !== '/Image') continue;

    const filters = getFilters(dict);
    const isJPEG = filters.includes('/DCTDecode');
    const isJPX = filters.includes('/JPXDecode');
    if (!isJPEG && !isJPX) continue;

    const bytes = tryGetStreamBytes(obj);
    if (!bytes?.length) continue;

    idx += 1;
    out.push({ idx, ext: isJPEG ? 'jpg' : 'jp2', bytes });
  }

  return out;
}
