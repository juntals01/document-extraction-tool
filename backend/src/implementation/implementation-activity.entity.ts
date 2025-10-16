import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Upload } from '../upload/upload.entity';

@Entity('implementation_activities')
export class ImplementationActivity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // FK → uploads.id
  @Index()
  @Column({ type: 'uuid', name: 'upload_id' })
  uploadId!: string;

  @ManyToOne(() => Upload, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'upload_id', referencedColumnName: 'id' })
  upload!: Upload;

  @Column({ type: 'text' })
  action!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actor!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  start!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  end!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  budget!: { value: number; currency: string } | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  status!: 'planned' | 'in-progress' | 'completed' | null;

  @Column({ type: 'jsonb', nullable: true })
  progress!: { value: number; unit: string } | null;

  @Column({ type: 'jsonb', default: [] })
  dependencies!: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'jsonb', default: [] })
  evidence!: string[];
}
