// backend/src/processed/processed-pdf.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('processed_pdfs')
@Index(['uploadId', 'pageNumber'], { unique: true })
export class ProcessedPdf {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  uploadId!: string;

  @Column({ type: 'int' })
  pageNumber!: number;

  @Column({ type: 'text', nullable: true })
  pagePdfPath!: string | null;

  // Optional: keep a plain text for quick search
  @Column({ type: 'text', nullable: true })
  extractedText!: string | null;

  // NEW: store rendered HTML with headings/subheadings
  @Column({ type: 'text', nullable: true })
  extractedHtml!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: 'pending' | 'done' | 'error';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
