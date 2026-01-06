import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class Milestone {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'timestamp' })
    dueDate: Date;

    @Column({ default: false })
    isCompleted: boolean;

    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date;

    @Column()
    projectId: string;

    @ManyToOne(() => Project)
    project: Project;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
