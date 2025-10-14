import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  storedName!: string;

  @Column({ type: 'text' })
  path!: string;

  @Column({ type: 'bigint' })
  size!: string;

  @Column({ type: 'varchar', length: 128 })
  mimetype!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
