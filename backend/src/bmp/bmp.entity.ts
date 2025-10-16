import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Upload } from '../upload/upload.entity';

@Entity('bmps')
export class BMP {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // FK → uploads.id
  @Index()
  @Column({ type: 'uuid', name: 'upload_id' })
  uploadId!: string;

  @ManyToOne(() => Upload, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'upload_id', referencedColumnName: 'id' })
  upload!: Upload;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  type!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  quantity!: { value: number; unit: string } | null;

  @Column({ type: 'jsonb', nullable: true })
  cost!: { value: number; currency: string } | null;

  @Column({ type: 'jsonb', nullable: true })
  progress!: { value: number; unit: string } | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  responsibleParty!: string | null;

  @Column({ type: 'jsonb', default: { start: null, end: null } })
  schedule!: { start: string | null; end: string | null };

  @Column({ type: 'jsonb', default: [] })
  relatedGoals!: string[];

  @Column({ type: 'jsonb', default: [] })
  evidence!: string[];
}
