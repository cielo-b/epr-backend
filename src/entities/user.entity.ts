import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { ProjectAssignment } from './project-assignment.entity';
import { Report } from './report.entity';

export enum UserRole {
  BOSS = 'BOSS',
  SUPERADMIN = 'SUPERADMIN',
  SECRETARY = 'SECRETARY',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVOPS = 'DEVOPS',
  DEVELOPER = 'DEVELOPER',
  VISITOR = 'VISITOR',
  OTHER = 'OTHER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OTHER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdById?: string | null;

  @ManyToOne(() => User, (user) => user.createdUsers, { nullable: true })
  createdBy?: User | null;

  @OneToMany(() => User, (user) => user.createdBy)
  createdUsers: User[];

  @OneToMany(() => Project, (project) => project.manager)
  managedProjects: Project[];

  @OneToMany(() => ProjectAssignment, (assignment) => assignment.developer)
  assignedProjects: ProjectAssignment[];

  @OneToMany(() => Project, (project) => project.creator)
  createdProjects: Project[];

  @OneToMany(() => Report, (report) => report.createdBy)
  reports: Report[];
}


