import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Upload } from '../upload/upload.entity';

@Entity('monitoring_metrics')
export class MonitoringMetric {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // FK → uploads.id
  @Index()
  @Column({ type: 'uuid', name: 'upload_id' })
  uploadId!: string;

  @ManyToOne(() => Upload, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'upload_id', referencedColumnName: 'id' })
  upload!: Upload;

  @Column({ type: 'varchar', length: 255 })
  parameter!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  method!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  frequency!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  threshold!: { value: number; unit: string } | null;

  @Column({ type: 'jsonb', nullable: true })
  progress!: { value: number; unit: string } | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  responsibleParty!: string | null;

  @Column({ type: 'jsonb', default: [] })
  evidence!: string[];
}
