import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity()
export class ConversationParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Conversation, conversation => conversation.participants, { onDelete: 'CASCADE' })
    @JoinColumn()
    conversation: Conversation;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column({ nullable: true })
    lastReadMessageId: string;
}
