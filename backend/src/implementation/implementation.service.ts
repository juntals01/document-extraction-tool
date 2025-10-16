import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ImplementationActivity } from './implementation-activity.entity';

@Injectable()
export class ImplementationService {
  constructor(
    @InjectRepository(ImplementationActivity)
    private repo: Repository<ImplementationActivity>,
  ) {}

  upsert(rows: ImplementationActivity[]) {
    return this.repo.upsert(rows, { conflictPaths: ['id'] });
  }

  create(row: ImplementationActivity) {
    return this.repo.save(this.repo.create(row));
  }

  findAll() {
    return this.repo.find();
  }

  async delete(uuid: string) {
    return this.repo.delete({ uuid });
  }

  async deleteMany(uuids: string[]) {
    return this.repo.delete({ uuid: In(uuids) });
  }
}
