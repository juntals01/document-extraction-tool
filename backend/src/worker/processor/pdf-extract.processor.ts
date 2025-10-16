// backend/src/processing/workers/pdf-extract.processor.ts
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fsp } from 'fs';
import { OpenAiService } from 'src/ai/openai.service';
import { PdfPageService } from '../../processing/services/pdf-page.service';
import { UploadService } from '../../upload/upload.service';

@Injectable()
export class PdfExtractProcessor {
  private readonly logger = new Logger(PdfExtractProcessor.name);

  constructor(
    private readonly uploads: UploadService,
    private readonly openai: OpenAiService,
    private readonly pages: PdfPageService,
  ) {}

  async process(uploadId: string) {
    const upload = await this.uploads.assertUploadExists(uploadId);

    const stats = await fsp.stat(upload.path);
    const buf = await fsp.readFile(upload.path);
    const checksum = createHash('sha256').update(buf).digest('hex');

    const processedRows = await this.pages.splitAndExtract(uploadId);

    // Prefer HTML for downstream LLM usage; keep text as backup
    const pageHtml = processedRows.map((r) => r.extractedHtml ?? '');
    const pageText = processedRows.map((r) => r.extractedText ?? '');

    // If you want, you can pass HTML to the analyzer:
    // const outline = await this.openai.analyzeDocumentStructure(pageHtml);
    const outline = pageHtml;

    this.logger.log(
      `✅ PDF processed ${upload.id} (${upload.slug}) pages=${processedRows.length} size=${stats.size}B sha256=${checksum.slice(0, 12)}…`,
    );

    return {
      pages: processedRows.length,
      sizeBytes: stats.size,
      checksum,
      outlineHtml: pageHtml,
      outlineText: pageText,
    };
  }
}
