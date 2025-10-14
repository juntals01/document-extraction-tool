import { Module } from '@nestjs/common';
import { DbModule } from './db/database.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [DbModule, UploadModule],
})
export class AppModule {}
