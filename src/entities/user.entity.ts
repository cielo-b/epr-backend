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
import { Notification } from './notification.entity';
import { UserPermission } from './user-permission.entity';
import { PushSubscription } from './push-subscription.entity';
import { CustomRole } from './custom-role.entity';

export enum UserRole {
  // SYSTEM LEVEL
  SUPERADMIN = 'SUPERADMIN', // System administrator

  // GENERAL SYNOD LEVEL (Whole Church)
  CHURCH_PRESIDENT = 'CHURCH_PRESIDENT', // President (Rev. Dr. Pascal Bataringaya)
  CHURCH_VICE_PRESIDENT = 'CHURCH_VICE_PRESIDENT', // Vice President
  CHURCH_SECRETARY = 'CHURCH_SECRETARY', // General Secretary
  CHURCH_ACCOUNTANT = 'CHURCH_ACCOUNTANT', // General Accountant/Treasurer
  CHURCH_WORKER = 'CHURCH_WORKER', // Other workers at General Synod level

  // PRESBYTERY LEVEL
  PRESBYTERY_MODERATOR = 'PRESBYTERY_MODERATOR', // Moderator of Presbytery
  PRESBYTERY_VICE_MODERATOR = 'PRESBYTERY_VICE_MODERATOR', // Vice Moderator
  PRESBYTERY_SECRETARY = 'PRESBYTERY_SECRETARY', // Presbytery Secretary
  PRESBYTERY_ACCOUNTANT = 'PRESBYTERY_ACCOUNTANT', // Presbytery Accountant
  PRESBYTERY_WORKER = 'PRESBYTERY_WORKER', // Other workers at Presbytery level

  // PARISH LEVEL
  PARISH_PASTOR = 'PARISH_PASTOR', // Pastor of the Parish
  PARISH_VICE_PASTOR = 'PARISH_VICE_PASTOR', // Vice Pastor/Assistant Pastor
  PARISH_SECRETARY = 'PARISH_SECRETARY', // Parish Secretary
  PARISH_ACCOUNTANT = 'PARISH_ACCOUNTANT', // Parish Accountant/Treasurer
  PARISH_WORKER = 'PARISH_WORKER', // Other workers at Parish level

  // COMMUNITY LEVEL
  COMMUNITY_LEADER = 'COMMUNITY_LEADER', // Community Elder/Leader
  COMMUNITY_ASSISTANT = 'COMMUNITY_ASSISTANT', // Assistant Community Leader

  // CLERGY & SPECIAL ROLES
  REVEREND = 'REVEREND', // Ordained Reverend
  DEACON = 'DEACON', // Deacon
  EVANGELIST = 'EVANGELIST', // Evangelist

  // GENERAL MEMBER
  MEMBER = 'MEMBER', // Regular church member
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
    default: UserRole.MEMBER,
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

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => UserPermission, (permission) => permission.user)
  permissions: UserPermission[];

  @OneToMany(() => PushSubscription, (subscription) => subscription.user)
  pushSubscriptions: PushSubscription[];

  @Column({ nullable: true })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpires: Date;

  // EPR Organizational Scope - Links user to their level in the church hierarchy
  @Column({ nullable: true })
  presbyteryId?: string;

  @Column({ nullable: true })
  parishId?: string;

  @Column({ nullable: true })
  communityId?: string;

  @Column({ nullable: true })
  avatarUrl: string;

  // Dynamic RBAC
  @Column({ nullable: true })
  customRoleId?: string;

  @ManyToOne(() => CustomRole, (role) => role.users, { nullable: true })
  customRole?: CustomRole;
}


