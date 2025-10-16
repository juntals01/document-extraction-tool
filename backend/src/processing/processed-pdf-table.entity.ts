import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProcessedPdf } from './processed-pdf.entity';

@Entity('processed_pdf_tables')
export class ProcessedPdfTable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  processedPdfId!: string;

  @ManyToOne(() => ProcessedPdf, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'processedPdfId' })
  processedPdf!: ProcessedPdf;

  @Column({ type: 'int' })
  index!: number;

  @Column({ type: 'text' })
  tablePath!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
