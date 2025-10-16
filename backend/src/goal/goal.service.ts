import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Goal } from './goal.entity';

@Injectable()
export class GoalService {
  constructor(@InjectRepository(Goal) private repo: Repository<Goal>) {}

  upsert(rows: Goal[]) {
    return this.repo.upsert(rows, { conflictPaths: ['id'] });
  }

  create(row: Goal) {
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
