import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Upload } from '../upload/upload.entity';

@Entity('outreach_activities')
export class OutreachActivity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // FK → uploads.id
  @Index()
  @Column({ type: 'uuid', name: 'upload_id' })
  uploadId!: string;

  @ManyToOne(() => Upload, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'upload_id', referencedColumnName: 'id' })
  upload!: Upload;

  @Column({ type: 'varchar', length: 255, nullable: true })
  audience!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  channel!: string | null;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  kpi!: { value: number; unit: string } | null;

  @Column({ type: 'jsonb', nullable: true })
  progress!: { value: number; unit: string } | null;

  @Column({ type: 'jsonb', default: { start: null, end: null } })
  schedule!: { start: string | null; end: string | null };

  @Column({ type: 'varchar', length: 255, nullable: true })
  responsibleParty!: string | null;

  @Column({ type: 'jsonb', default: [] })
  evidence!: string[];
}
