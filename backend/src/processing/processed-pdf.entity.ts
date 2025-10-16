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

  // groups pages by the original upload
  @Column({ type: 'varchar', length: 128 })
  uploadId!: string;

  // page number within the original PDF (0/1-based — whichever you use consistently)
  @Column({ type: 'int' })
  pageNumber!: number;

  @Column({ type: 'text', nullable: true })
  pagePdfPath!: string | null;

  // quick-searchable text (optional)
  @Column({ type: 'text', nullable: true })
  extractedText!: string | null;

  // rendered HTML (headings, lists, etc.)
  @Column({ type: 'text', nullable: true })
  extractedHtml!: string | null;

  // ✅ NEW: AI output for this page (parsed JSON if available)
  @Column({ type: 'jsonb', nullable: true })
  structuredJson!: any | null;

  // ✅ NEW: raw AI output when JSON parsing fails (for debugging)
  @Column({ type: 'text', nullable: true })
  structuredRaw!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: 'pending' | 'done' | 'error';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
