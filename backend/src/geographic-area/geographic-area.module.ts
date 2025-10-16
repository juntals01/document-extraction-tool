import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeographicArea } from './geographic-area.entity';
import { GeographicAreaService } from './geographic-area.service';

@Module({
  imports: [TypeOrmModule.forFeature([GeographicArea])],
  providers: [GeographicAreaService],
  exports: [GeographicAreaService],
})
export class GeographicAreaModule {}
