// backend/src/processing/services/pdf-page.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import type { Repository } from 'typeorm';

import { UploadService } from '../../upload/upload.service';
import { ensureDir } from '../../upload/utils/ensure-dir';

import {
  folderForUploadSlug,
  imageName,
  pagePdfName,
  tableName,
} from 'src/utils/file-names';
import { buildHtmlFromTextItems, escapeHtml } from 'src/utils/html-from-text';
import { extractImagesFromPage } from 'src/utils/image-extract';
import { getPdfTableExtractor } from 'src/utils/pdf-table-extractor';
import { getPdfjs } from 'src/utils/pdfjs';
import { buildTablesFromPlainText } from 'src/utils/table-text-heuristic';
import { ProcessedPdfImage } from '../processed-pdf-image.entity';
import { ProcessedPdfTable } from '../processed-pdf-table.entity';
import { ProcessedPdf } from '../processed-pdf.entity';

@Injectable()
export class PdfPageService {
  private readonly logger = new Logger(PdfPageService.name);

  constructor(
    private readonly uploads: UploadService,
    @Inject('PROCESSED_PDF_REPOSITORY')
    private readonly processedRepo: Repository<ProcessedPdf>,
    @Inject('PROCESSED_PDF_IMAGE_REPOSITORY')
    private readonly imageRepo: Repository<ProcessedPdfImage>,
    @Inject('PROCESSED_PDF_TABLE_REPOSITORY')
    private readonly tableRepo: Repository<ProcessedPdfTable>,
  ) {}

  // ---------- Save tables detected from plain text (fallback) ----------
  private async detectAndSaveTablesForPage(opts: {
    slugDir: string;
    pageNumber: number;
    processedPdf: ProcessedPdf;
    plainText: string;
  }) {
    const { slugDir, pageNumber, processedPdf, plainText } = opts;
    const tables = buildTablesFromPlainText(plainText);
    let idx = 0;
    for (const tableHtml of tables) {
      idx += 1;
      const fileName = tableName(pageNumber, idx);
      const filePath = path.join(slugDir, fileName);
      await fsp.writeFile(filePath, tableHtml, 'utf8');
      await this.tableRepo.save(
        this.tableRepo.create({
          processedPdfId: processedPdf.id,
          index: idx,
          tablePath: filePath,
        }),
      );
    }
  }

  /**
   * Split original PDF, extract HTML/text/images, then extract visual tables
   * with pdf-table-extractor (whole-file), mapping to per-page DB rows.
   */
  async splitAndExtract(uploadId: string) {
    const upload = await this.uploads.assertUploadExists(uploadId);

    const slugDir = folderForUploadSlug(upload.slug);
    await ensureDir(slugDir);

    // Read file → Uint8Array
    const buf = await fsp.readFile(upload.path);
    const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

    // Split to per-page PDFs (artifacts)
    const originalDoc = await PDFDocument.load(bytes);
    const totalPages = originalDoc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      const newDoc = await PDFDocument.create();
      const [copied] = await newDoc.copyPages(originalDoc, [i]);
      newDoc.addPage(copied);
      const perPageBytes = await newDoc.save();
      const pagePdfPath = path.join(slugDir, pagePdfName(pageNumber));
      await fsp.writeFile(pagePdfPath, perPageBytes);

      await this.processedRepo.upsert(
        {
          uploadId: upload.id,
          pageNumber,
          pagePdfPath,
          extractedHtml: null,
          extractedText: null,
          status: 'pending',
        },
        { conflictPaths: ['uploadId', 'pageNumber'] },
      );
    }

    // Text extraction with pdf.js (no worker)
    const pdfjs: any = await getPdfjs();
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      useWorker: false,
      isEvalSupported: false,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const { html, plain } = buildHtmlFromTextItems(
        content.items as any[],
        viewport.width,
        viewport.height,
      );

      // Upsert DB row with HTML/text
      await this.processedRepo.upsert(
        {
          uploadId: upload.id,
          pageNumber,
          extractedHtml: `<section data-page="${pageNumber}">${html}</section>`,
          extractedText: plain,
          status: 'done',
        },
        { conflictPaths: ['uploadId', 'pageNumber'] },
      );

      // Get processed row id
      const processed = await this.processedRepo.findOneOrFail({
        where: { uploadId: upload.id, pageNumber },
      });

      // Images for this page (pure extract → write → save rows)
      const images = extractImagesFromPage(originalDoc, pageNumber - 1);
      for (const img of images) {
        const fileName = imageName(pageNumber, img.idx, img.ext);
        const filePath = path.join(slugDir, fileName);
        await fsp.writeFile(filePath, img.bytes);
        await this.imageRepo.save(
          this.imageRepo.create({
            processedPdfId: processed.id,
            index: img.idx,
            imagePath: filePath,
          }),
        );
      }

      // Fallback text-based tables (may be none for drawn tables)
      await this.detectAndSaveTablesForPage({
        slugDir,
        pageNumber,
        processedPdf: processed,
        plainText: processed.extractedText ?? '',
      });
    }

    // ---- Visual table extraction (whole file) with pdf-table-extractor ----
    // Build a map of pageNumber -> processedPdfId for correct foreign key
    const processedAll = await this.processedRepo.find({
      where: { uploadId: upload.id },
    });
    const idByPage = new Map<number, string>();
    processedAll.forEach((r) => idByPage.set(r.pageNumber, r.id));

    try {
      const pdfTableExtractor = await getPdfTableExtractor();
      await new Promise<void>((resolve, reject) => {
        pdfTableExtractor(
          upload.path,
          async (result: any) => {
            // result.pageTables: [{ page: 1, tables: string[][], ... }, ...]
            const perPageIdx: Record<number, number> = {};
            for (const pt of result.pageTables as any[]) {
              const pageNo = Number(pt.page);
              const processedId = idByPage.get(pageNo);
              if (!processedId) continue;

              perPageIdx[pageNo] = perPageIdx[pageNo] ?? 0;

              // Convert each table (array of rows) into HTML safely
              for (const tableRows of pt.tables as any) {
                perPageIdx[pageNo] += 1;
                const idx = perPageIdx[pageNo];

                const rows: string[][] = Array.isArray(tableRows?.[0])
                  ? (tableRows as string[][])
                  : [
                      Array.isArray(tableRows)
                        ? (tableRows as string[])
                        : [String(tableRows ?? '')],
                    ];

                const htmlRows = rows
                  .map(
                    (row) =>
                      `<tr>${row
                        .map(
                          (cell) =>
                            `<td>${escapeHtml(String(cell ?? ''))}</td>`,
                        )
                        .join('')}</tr>`,
                  )
                  .join('');

                const tableHtml = `<table data-detected="pdf-table-extractor">${htmlRows}</table>`;

                const fileName = tableName(pageNo, idx);
                const filePath = path.join(slugDir, fileName);
                await fsp.writeFile(filePath, tableHtml, 'utf8');

                await this.tableRepo.save(
                  this.tableRepo.create({
                    processedPdfId: processedId,
                    index: idx,
                    tablePath: filePath,
                  }),
                );
              }
            }
            resolve();
          },
          (err: any) => reject(err),
        );
      });
    } catch (err) {
      this.logger.warn(
        `Table extractor failed (fallback to text heuristic only): ${String(err)}`,
      );
    }

    return this.processedRepo.find({
      where: { uploadId: upload.id },
      order: { pageNumber: 'ASC' },
    });
  }
}
