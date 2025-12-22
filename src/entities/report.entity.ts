import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity()
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  @Index()
  type: string;

  @Column({ nullable: true })
  @Index()
  projectId?: string | null;

  @ManyToOne(() => Project, (project) => project.reports, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  project?: Project | null;

  @Column()
  @Index()
  createdById: string;

  @ManyToOne(() => User, (user) => user.reports)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


