import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

export enum AnnouncementPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

@Entity()
export class Announcement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    message: string;

    @Column({
        type: 'enum',
        enum: AnnouncementPriority,
        default: AnnouncementPriority.LOW,
    })
    priority: AnnouncementPriority;

    @Column()
    authorId: string;

    @ManyToOne(() => User)
    author: User;

    @Column()
    projectId: string;

    @ManyToOne(() => Project)
    project: Project;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
