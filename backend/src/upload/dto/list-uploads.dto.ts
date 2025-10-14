import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListUploadsDto {
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  limit?: number;
}
