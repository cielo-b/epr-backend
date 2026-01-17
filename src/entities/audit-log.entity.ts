import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    action: string; // CREATE, UPDATE, DELETE, IMPORT, EXPORT, LOGIN

    @Column()
    module: string; // Members, Clergy, Expenses, Parishes, etc.

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'jsonb', nullable: true })
    payload: any; // The data associated with the action

    @Column({ nullable: true })
    recordId: string; // The ID of the record affected

    @CreateDateColumn()
    timestamp: Date;

    @Column()
    actorId: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    actor: User;

    @Column({ nullable: true })
    ipAddress: string;
}
