import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string; // For group chats

    @Column({ default: false })
    isGroup: boolean;

    @OneToMany(() => ConversationParticipant, participant => participant.conversation)
    participants: ConversationParticipant[];

    @OneToMany(() => Message, message => message.conversation)
    messages: Message[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
