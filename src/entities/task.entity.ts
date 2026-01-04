import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

export enum TaskStatus {
    BACKLOG = 'BACKLOG',
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    ON_HOLD = 'ON_HOLD',
}

export enum TaskTag {
    BACKEND = 'BACKEND',
    FRONTEND = 'FRONTEND',
    DESIGN = 'DESIGN',
    DEVOPS = 'DEVOPS',
    QA = 'QA',
    MANAGEMENT = 'MANAGEMENT',
    OTHER = 'OTHER',
}

@Entity()
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.OPEN,
    })
    status: TaskStatus;

    @Column({
        type: 'enum',
        enum: TaskTag,
        array: true, // PostgreSQL supports array columns, simpler than a separate entity for simple tags
        default: [TaskTag.OTHER],
    })
    tags: TaskTag[];

    @Column({ type: 'timestamp', nullable: true })
    dueDate?: Date;

    @Column()
    projectId: string;

    @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
    project: Project;

    @Column()
    createdById: string;

    @ManyToOne(() => User, (user) => user.createdTasks)
    createdBy: User;

    @ManyToMany(() => User, (user) => user.assignedTasks)
    @JoinTable({
        name: 'task_assignments',
        joinColumn: {
            name: 'task_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'id',
        },
    })
    assignees: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
