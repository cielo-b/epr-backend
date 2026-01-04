import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProjectAssignment } from './project-assignment.entity';
import { Document } from './document.entity';
import { Report } from './report.entity';
import { Task } from './task.entity';

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date | null;

  @Column({ nullable: true })
  githubUrl?: string;

  @Column({ nullable: true })
  deployUrl?: string;

  @Column({ type: 'text', nullable: true })
  serverDetails?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  managerId: string;

  @ManyToOne(() => User, (user) => user.managedProjects)
  manager: User;

  @Column()
  creatorId: string;

  @ManyToOne(() => User, (user) => user.createdProjects)
  creator: User;

  @OneToMany(() => ProjectAssignment, (assignment) => assignment.project)
  assignments: ProjectAssignment[];

  @OneToMany(() => Document, (document) => document.project)
  documents: Document[];

  @OneToMany(() => Report, (report) => report.project)
  reports: Report[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];
}


