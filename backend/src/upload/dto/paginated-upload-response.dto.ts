import { ApiProperty } from '@nestjs/swagger';
import { UploadResponseDto } from './upload-response.dto';

export class PaginatedUploadResponseDto {
  @ApiProperty({ type: [UploadResponseDto] })
  items!: UploadResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;
}
