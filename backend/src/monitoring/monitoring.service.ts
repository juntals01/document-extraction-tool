import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MonitoringMetric } from './monitoring-metric.entity';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(MonitoringMetric)
    private repo: Repository<MonitoringMetric>,
  ) {}

  upsert(rows: MonitoringMetric[]) {
    return this.repo.upsert(rows, { conflictPaths: ['id'] });
  }

  create(row: MonitoringMetric) {
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
