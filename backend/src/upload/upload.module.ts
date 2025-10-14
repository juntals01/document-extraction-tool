import { Module } from '@nestjs/common';
import { QueueModule } from 'src/queue/queue.module';
import { DataSource } from 'typeorm';
import { DbModule } from '../db/database.module';
import { UploadController } from './upload.controller';
import { Upload } from './upload.entity';
import { UploadService } from './upload.service';

export const UploadRepositoryProvider = {
  provide: 'UPLOAD_REPOSITORY',
  useFactory: (dataSource: DataSource) => dataSource.getRepository(Upload),
  inject: ['DATA_SOURCE'],
};

@Module({
  imports: [DbModule, QueueModule],
  controllers: [UploadController],
  providers: [UploadService, UploadRepositoryProvider],
  exports: [UploadService],
})
export class UploadModule {}
