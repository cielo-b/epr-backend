import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum PermissionResource {
    CLERGY = 'CLERGY',
    MEMBERS = 'MEMBERS',
    EXPENSES = 'EXPENSES',
    EVENTS = 'EVENTS',
    CONTRIBUTIONS = 'CONTRIBUTIONS',
    SACRAMENTS = 'SACRAMENTS',
    PRESBYTERIES = 'PRESBYTERIES',
    PARISHES = 'PARISHES',
    COMMUNITIES = 'COMMUNITIES',
    SETTINGS = 'SETTINGS',
    AUDIT_LOGS = 'AUDIT_LOGS',
}

export enum PermissionAction {
    VIEW = 'VIEW',
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    DOWNLOAD = 'DOWNLOAD',
    UPLOAD = 'UPLOAD',
    ASSIGN = 'ASSIGN',
}

@Entity('user_permissions')
export class UserPermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    // What resource (PROJECT, TASK, etc.)
    @Column({
        type: 'enum',
        enum: PermissionResource,
    })
    resource: PermissionResource;

    // What action (VIEW, CREATE, UPDATE, DELETE)
    @Column({
        type: 'enum',
        enum: PermissionAction,
    })
    action: PermissionAction;

    // Optional: Specific resource ID (e.g., specific project ID)
    // If null, applies to all resources of this type
    @Column({ nullable: true })
    resourceId: string | null;

    // Optional: Additional constraints (JSON)
    // Example: { "fields": ["name", "description"], "tabs": ["details", "documents"] }
    @Column({ type: 'json', nullable: true })
    constraints: Record<string, any> | null;

    // Who granted this permission
    @Column({ nullable: true })
    grantedBy: string | null;

    @CreateDateColumn()
    createdAt: Date;

    // Optional: Expiration date
    @Column({ nullable: true })
    expiresAt: Date | null;
}
