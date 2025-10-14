import { Module } from '@nestjs/common';
import { dbProvider } from './database.providers';

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule {}
