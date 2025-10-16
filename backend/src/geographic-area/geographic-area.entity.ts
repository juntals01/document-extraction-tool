import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Upload } from '../upload/upload.entity';

@Entity('geographic_areas')
@Unique('uq_geoarea_upload_name', ['uploadId', 'name'])
export class GeographicArea {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  // FK → uploads.id (top-level file)
  @Index('idx_geoarea_upload_id')
  @Column({ type: 'uuid', name: 'upload_id' })
  uploadId!: string;

  @ManyToOne(() => Upload, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'upload_id', referencedColumnName: 'id' })
  upload!: Upload;

  // Array of page-image IDs (no relation, we store uuids[])
  @Column('uuid', { name: 'processed_image_ids', array: true, nullable: true })
  processedImageIds!: string[] | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  huc!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  coordinates!: Array<{ lat: number; lon: number }> | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', default: [] })
  evidence!: string[];
}
