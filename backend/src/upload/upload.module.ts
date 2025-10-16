import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbModule } from '../db/database.module';
import { ProcessingModule } from '../processing/processing.module';
import { QueueModule } from '../queue/queue.module'; // use relative path
import { UploadController } from './upload.controller';
import { Upload } from './upload.entity';
import { UploadService } from './upload.service';

@Module({
  imports: [
    DbModule, // provides TypeORM DataSource (forRoot*)
    TypeOrmModule.forFeature([Upload]), // binds Repository<Upload> to DI
    QueueModule,
    ProcessingModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
