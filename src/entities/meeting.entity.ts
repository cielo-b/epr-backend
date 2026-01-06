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
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity()
export class Meeting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'timestamp', nullable: true })
    startTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    endTime: Date;

    @Column({ nullable: true })
    meetingLink?: string;

    @Column({ nullable: true })
    organizerId: string;

    @ManyToOne(() => User)
    organizer: User;

    @Column({ nullable: true })
    projectId?: string;

    @ManyToOne(() => Project, { nullable: true })
    project?: Project;

    @ManyToMany(() => User)
    @JoinTable()
    attendees: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
