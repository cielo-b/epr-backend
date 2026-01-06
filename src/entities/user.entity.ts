import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Project } from './project.entity';
import { ProjectAssignment } from './project-assignment.entity';
import { Report } from './report.entity';
import { Task } from './task.entity';
import { Notification } from './notification.entity';
import { UserPermission } from './user-permission.entity';

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

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @ManyToMany(() => Task, (task) => task.assignees)
  assignedTasks: Task[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => UserPermission, (permission) => permission.user)
  permissions: UserPermission[];
}


