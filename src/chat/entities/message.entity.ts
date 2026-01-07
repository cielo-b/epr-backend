import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @ManyToOne(() => Conversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn()
    conversation: Conversation;

    @ManyToOne(() => User, { eager: true }) // Eager load sender info
    @JoinColumn()
    sender: User;

    @Column({ nullable: true })
    attachmentUrl: string;

    @Column({ nullable: true })
    attachmentType: string; // 'image', 'file', etc.

    @Column({ default: false })
    isDeleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
