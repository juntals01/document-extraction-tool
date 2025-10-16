import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OutreachActivity } from './outreach-activity.entity';

@Injectable()
export class OutreachService {
  constructor(
    @InjectRepository(OutreachActivity)
    private repo: Repository<OutreachActivity>,
  ) {}

  upsert(rows: OutreachActivity[]) {
    return this.repo.upsert(rows, { conflictPaths: ['id'] });
  }

  create(row: OutreachActivity) {
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
