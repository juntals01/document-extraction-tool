import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { promises as fsp } from 'fs';
import { Repository } from 'typeorm';

import { OpenAiService } from 'src/ai/openai.service';
import { ProcessedPdfImage } from 'src/processing/processed-pdf-image.entity'; // adjust path if different
import { ExtractionPersistService } from 'src/processing/services/extraction-persist.service';
import { PdfPageService } from 'src/processing/services/pdf-page.service';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class PdfExtractProcessor {
  private readonly logger = new Logger(PdfExtractProcessor.name);

  constructor(
    private readonly uploads: UploadService,
    private readonly openai: OpenAiService,
    private readonly pages: PdfPageService,
    private readonly persist: ExtractionPersistService,
    @InjectRepository(ProcessedPdfImage)
    private readonly imagesRepo: Repository<ProcessedPdfImage>,
  ) {}

  private async getImageIdsForPage(processedPageId: string): Promise<string[]> {
    const rows = await this.imagesRepo.find({
      where: { processedPdfId: processedPageId },
      select: ['id'],
    });
    return rows.map((r) => r.id);
  }

  async process(uploadId: string) {
    const upload = await this.uploads.assertUploadExists(uploadId);

    const stats = await fsp.stat(upload.path);
    const buf = await fsp.readFile(upload.path);
    const checksum = createHash('sha256').update(buf).digest('hex');

    // 1) Split & extract per page
    const processedRows = await this.pages.splitAndExtract(uploadId);

    // 2) Run AI extractor per page and persist
    const concurrency = Number(process.env.AI_CONCURRENCY ?? 3);
    const queue = [...processedRows];
    const workers: Promise<void>[] = [];

    const runWorker = async () => {
      while (queue.length) {
        const row = queue.shift()!;
        try {
          const html = row.extractedHtml ?? '';
          const ai = await this.openai.extractGovAgriPage(html);

          // Save raw/structured AI output on the page row (for debugging/auditing)
          await this.pages.saveStructuredResult(row.id, ai ?? null);

          // Persist normalized records keyed by uploadId
          if (ai && typeof ai === 'object') {
            const hasAreas =
              Array.isArray(ai.geographicAreas) &&
              ai.geographicAreas.length > 0;

            const processedImageIds = hasAreas
              ? await this.getImageIdsForPage(row.id)
              : null;

            await this.persist.saveFromAiResult({
              uploadId, // parent Upload FK
              result: ai,
              processedImageIds, // <-- array of UUIDs or null
            });
          }

          this.logger.log(
            `AI extracted & saved page ${row.pageNumber} (pageId=${row.id}, uploadId=${uploadId})`,
          );
        } catch (err) {
          this.logger.error(
            `AI extraction failed for page ${row.id}: ${String(err)}`,
          );
          await this.pages.saveStructuredResult(row.id, null);
        }
      }
    };

    for (let i = 0; i < Math.max(1, concurrency); i++) {
      workers.push(runWorker());
    }
    await Promise.all(workers);

    // 3) Return summary for caller
    const pageHtml = processedRows.map((r) => r.extractedHtml ?? '');
    const pageText = processedRows.map((r) => r.extractedText ?? '');

    this.logger.log(
      `✅ PDF processed upload=${upload.id} (${upload.slug}) pages=${processedRows.length} size=${stats.size}B sha256=${checksum.slice(0, 12)}…`,
    );

    return {
      uploadId: upload.id,
      pages: processedRows.length,
      sizeBytes: stats.size,
      checksum,
      outlineHtml: pageHtml,
      outlineText: pageText,
    };
  }
}
