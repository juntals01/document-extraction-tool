// backend/src/processing/processing.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiModule } from 'src/ai/ai.module';
import { BMP } from '../bmp/bmp.entity';
import { GeographicArea } from '../geographic-area/geographic-area.entity';
import { Goal } from '../goal/goal.entity';
import { ImplementationActivity } from '../implementation/implementation-activity.entity';
import { MonitoringMetric } from '../monitoring/monitoring-metric.entity';
import { OutreachActivity } from '../outreach/outreach-activity.entity';
import { UploadModule } from '../upload/upload.module';
import { ProcessedPdfImage } from './processed-pdf-image.entity';
import { ProcessedPdfTable } from './processed-pdf-table.entity';
import { ProcessedPdf } from './processed-pdf.entity';
import { ExtractionPersistService } from './services/extraction-persist.service';
import { PdfPageService } from './services/pdf-page.service';
import { ReportService } from './services/report.service';

@Module({
  imports: [
    AiModule,
    TypeOrmModule.forFeature([
      Goal,
      BMP,
      ImplementationActivity,
      MonitoringMetric,
      OutreachActivity,
      GeographicArea,
      ProcessedPdf,
      ProcessedPdfImage,
      ProcessedPdfTable,
    ]),
    forwardRef(() => UploadModule),
  ],
  providers: [PdfPageService, ExtractionPersistService, ReportService],
  exports: [PdfPageService, ExtractionPersistService, ReportService],
})
export class ProcessingModule {}
