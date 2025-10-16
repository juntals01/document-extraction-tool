// backend/src/processing/utils/file-names.ts
import * as path from 'path';

export function folderForUploadSlug(slug: string) {
  const uploadRoot =
    process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), 'uploads');
  return path.join(uploadRoot, slug);
}
export function pagePdfName(pageNumber: number) {
  return `page-${pageNumber}.pdf`;
}
export function imageName(pageNumber: number, idx: number, ext: 'jpg' | 'jp2') {
  return `image-p${pageNumber}-${idx}.${ext}`;
}
export function tableName(pageNumber: number, idx: number) {
  return `table-p${pageNumber}-t${idx}.html`;
}
