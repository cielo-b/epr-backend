import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Project } from './project.entity';
import { Report } from './report.entity';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column('int')
  size: number;

  @Column()
  path: string;

  @Column({ nullable: true })
  @Index()
  projectId?: string | null;

  @ManyToOne(() => Project, (project) => project.documents, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  project?: Project | null;

  @Column({ nullable: true })
  @Index()
  reportId?: string | null;

  @ManyToOne(() => Report, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  report?: Report | null;

  @Column({ nullable: true })
  uploadedById?: string | null;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: false })
  isFolder: boolean;

  @Column({ nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Document, (doc) => doc.children, { nullable: true, onDelete: 'CASCADE' })
  parent?: Document | null;

  @OneToMany(() => Document, (doc) => doc.parent)
  children: Document[];

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  previousVersionId?: string | null;

  @ManyToOne(() => Document, { nullable: true })
  previousVersion?: Document | null;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date | null;

  @Column({
    type: 'enum',
    enum: ['CONFIDENTIAL', 'PUBLIC'],
    default: 'PUBLIC'
  })
  confidentiality: 'CONFIDENTIAL' | 'PUBLIC';
}

export enum ConfidentialityLevel {
  CONFIDENTIAL = 'CONFIDENTIAL',
  PUBLIC = 'PUBLIC',
}



