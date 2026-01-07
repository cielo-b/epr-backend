import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class PushSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, user => user.pushSubscriptions, { onDelete: 'CASCADE' })
    user: User;

    @Column('text')
    endpoint: string;

    @Column('text')
    p256dh: string;

    @Column('text')
    auth: string;

    @CreateDateColumn()
    createdAt: Date;
}
