import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DbModule } from '../db/database.module';
import { UploadModule } from '../upload/upload.module';
import { ProcessedPdfImage } from './processed-pdf-image.entity';
import { ProcessedPdfTable } from './processed-pdf-table.entity';
import { ProcessedPdf } from './processed-pdf.entity';
import { PdfPageService } from './services/pdf-page.service';

export const ProcessedPdfRepoProvider = {
  provide: 'PROCESSED_PDF_REPOSITORY',
  useFactory: (ds: DataSource) => ds.getRepository(ProcessedPdf),
  inject: ['DATA_SOURCE'],
};
export const ProcessedPdfImageRepoProvider = {
  provide: 'PROCESSED_PDF_IMAGE_REPOSITORY',
  useFactory: (ds: DataSource) => ds.getRepository(ProcessedPdfImage),
  inject: ['DATA_SOURCE'],
};
export const ProcessedPdfTableRepoProvider = {
  provide: 'PROCESSED_PDF_TABLE_REPOSITORY',
  useFactory: (ds: DataSource) => ds.getRepository(ProcessedPdfTable),
  inject: ['DATA_SOURCE'],
};

@Module({
  imports: [DbModule, UploadModule],
  providers: [
    PdfPageService,
    ProcessedPdfRepoProvider,
    ProcessedPdfImageRepoProvider,
    ProcessedPdfTableRepoProvider,
  ],
  exports: [
    PdfPageService,
    ProcessedPdfRepoProvider,
    ProcessedPdfImageRepoProvider,
    ProcessedPdfTableRepoProvider,
  ],
})
export class ProcessingModule {}
