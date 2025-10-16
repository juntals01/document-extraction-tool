import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GeographicArea } from './geographic-area.entity';

@Injectable()
export class GeographicAreaService {
  constructor(
    @InjectRepository(GeographicArea) private repo: Repository<GeographicArea>,
  ) {}

  upsert(rows: GeographicArea[]) {
    return this.repo.upsert(rows, { conflictPaths: ['id'] });
  }

  create(row: GeographicArea) {
    return this.repo.save(this.repo.create(row));
  }

  findAll() {
    return this.repo.find({ relations: ['image'] });
  }

  async delete(id: string) {
    return this.repo.delete({ id });
  }

  async deleteMany(ids: string[]) {
    return this.repo.delete({ id: In(ids) });
  }
}
