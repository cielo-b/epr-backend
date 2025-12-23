import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity()
export class ActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    action: string; // e.g., 'STATUS_CHANGE', 'UPLOAD', 'COMMENT', 'ASSIGN', 'REMOVE'

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    timestamp: Date;

    @Column()
    actorId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    actor: User;

    @Column({ nullable: true })
    projectId?: string;

    @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
    project?: Project;
}
