import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity()
@Unique(['projectId', 'developerId'])
export class ProjectAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.assignments, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  @Index()
  developerId: string;

  @ManyToOne(() => User, (user) => user.assignedProjects, {
    onDelete: 'CASCADE',
  })
  developer: User;

  @CreateDateColumn()
  assignedAt: Date;

  @Column({ nullable: true })
  assignedById?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ default: 'General' })
  role: string;
}


