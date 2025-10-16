import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BMP } from './bmp.entity';
import { BMPService } from './bmp.service';

@Module({
  imports: [TypeOrmModule.forFeature([BMP])],
  providers: [BMPService],
  exports: [BMPService],
})
export class BMPModule {}
