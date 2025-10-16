import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Upload } from '../upload/upload.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // FK → uploads.id
  @Index()
  @Column({ type: 'uuid', name: 'upload_id' })
  uploadId!: string;

  @ManyToOne(() => Upload, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'upload_id', referencedColumnName: 'id' })
  upload!: Upload;

  @Column({ type: 'varchar', length: 512, nullable: true })
  title!: string | null;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  pollutant!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  target!: { value: number; unit: string } | null;

  @Column({ type: 'jsonb', nullable: true })
  progress!: { value: number; unit: string } | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  deadline!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'jsonb', default: [] })
  evidence!: string[];
}
