import { Module } from '@nestjs/common';
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
  imports: [DbModule],
  controllers: [UploadController],
  providers: [UploadService, UploadRepositoryProvider],
})
export class UploadModule {}
