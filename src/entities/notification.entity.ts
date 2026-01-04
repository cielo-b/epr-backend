import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    message: string;

    @Column()
    type: string; // 'INFO', 'SUCCESS', 'WARNING', 'ERROR'

    @Column({ default: false })
    isRead: boolean;

    @Column()
    userId: string;

    @ManyToOne(() => User, user => user.notifications)
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}
