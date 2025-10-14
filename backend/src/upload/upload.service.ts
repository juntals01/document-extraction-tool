import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { promises as fsp } from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CreateUploadDto } from './dto/create-upload.dto';
import { Upload } from './upload.entity';

@Injectable()
export class UploadService {
  constructor(
    @Inject('UPLOAD_REPOSITORY') private readonly repo: Repository<Upload>,
  ) {}

  getUploadDir() {
    return (
      process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), 'uploads')
    );
  }

  async uniqueSlug(baseSlug: string, ext = '.pdf'): Promise<string> {
    const tryPath = (slug: string) =>
      path.join(this.getUploadDir(), `${slug}${ext}`);
    let candidate = baseSlug;
    let n = 2;
    for (;;) {
      try {
        await fsp.access(tryPath(candidate));
        candidate = `${baseSlug}-${n++}`;
      } catch {
        return candidate;
      }
    }
  }

  /** Persists multiple uploaded file records to the database. */
  async createMany(rows: CreateUploadDto[]) {
    const entities = rows.map((r) =>
      this.repo.create({ ...r, size: String(r.size) }),
    );
    return this.repo.save(entities);
  }

  /** List uploads with pagination. */
  async listUploads(page = 1, limit = 20) {
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.repo.findAndCount({
      take,
      skip,
      order: { createdAt: 'DESC' as any },
    });
    return { items, total };
  }

  /** Ensure an upload exists; return it or throw 404. */
  async assertUploadExists(uploadId: string) {
    const found = await this.repo.findOne({ where: { id: uploadId } as any });
    if (!found) throw new NotFoundException('Upload not found');
    return found;
  }
}
