import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BMP } from './bmp.entity';

@Injectable()
export class BMPService {
  constructor(@InjectRepository(BMP) private repo: Repository<BMP>) {}

  /**
   * Bulk save (insert or update by primary key if exists)
   */
  async upsert(rows: BMP[]) {
    return this.repo.save(rows);
  }

  /**
   * Create one BMP record
   */
  async create(row: Partial<BMP>) {
    const entity = this.repo.create(row);
    return this.repo.save(entity);
  }

  /**
   * Get all BMPs, optionally filtered by uploadId
   */
  async findAll(uploadId?: string) {
    if (uploadId) {
      return this.repo.find({ where: { uploadId } });
    }
    return this.repo.find();
  }

  /**
   * Delete one BMP by its primary key (uuid)
   */
  async delete(uuid: string) {
    return this.repo.delete({ uuid });
  }

  /**
   * Delete many BMPs by their primary keys
   */
  async deleteMany(uuids: string[]) {
    return this.repo.delete({ uuid: In(uuids) });
  }
}
