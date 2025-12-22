import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
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
isArchived: boolean;

@Column({ type: 'timestamp', nullable: true })
archivedAt?: Date | null;
}


