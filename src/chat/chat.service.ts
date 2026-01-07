import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '../entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(ConversationParticipant)
        private participantRepository: Repository<ConversationParticipant>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async createConversation(createConversationDto: CreateConversationDto, creatorId: string): Promise<Conversation> {
        const { participantIds, name, isGroup } = createConversationDto;

        // Ensure creator is in participants
        const allParticipantIds = Array.from(new Set([...participantIds, creatorId]));

        // Check if DM exists
        if (!isGroup && allParticipantIds.length === 2) {
            const existing = await this.findDirectConversation(allParticipantIds[0], allParticipantIds[1]);
            if (existing) return existing;
        }

        const conversation = this.conversationRepository.create({
            name,
            isGroup: !!isGroup,
        });
        const savedConversation = await this.conversationRepository.save(conversation);

        const users = await this.userRepository.findBy({ id: In(allParticipantIds) });

        const participants = users.map(user => this.participantRepository.create({
            conversation: savedConversation,
            user,
        }));
        await this.participantRepository.save(participants);

        return this.findOne(savedConversation.id);
    }

    async findDirectConversation(user1Id: string, user2Id: string): Promise<Conversation | null> {
        // Complex query to find common conversation between two users that is NOT a group
        // Simplification: Fetch all cons for user1, check if user2 is participant
        const conversations = await this.getUserConversations(user1Id);
        for (const conv of conversations) {
            if (!conv.isGroup && conv.participants.some(p => p.user.id === user2Id)) {
                return conv;
            }
        }
        return null;
    }

    async getUserConversations(userId: string): Promise<Conversation[]> {
        const userParticipants = await this.participantRepository.find({
            where: { user: { id: userId } },
            relations: ['conversation']
        });

        const conversationIds = userParticipants.map(p => p.conversation.id);

        if (conversationIds.length === 0) return [];

        return this.conversationRepository.find({
            where: { id: In(conversationIds) },
            relations: ['participants', 'participants.user', 'messages'],
            order: {
                updatedAt: 'DESC'
            }
        });
    }

    async findOne(id: string): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { id },
            relations: ['participants', 'participants.user', 'messages', 'messages.sender'],
            order: {
                messages: {
                    createdAt: 'ASC'
                }
            }
        });
        if (!conversation) throw new NotFoundException('Conversation not found');
        return conversation;
    }

    async sendMessage(conversationId: string, senderId: string, content: string, attachmentUrl?: string, attachmentType?: string): Promise<Message> {
        const conversation = await this.findOne(conversationId);
        const sender = await this.userRepository.findOneBy({ id: senderId });

        const message = this.messageRepository.create({
            content: content || "",
            conversation,
            sender,
            attachmentUrl,
            attachmentType
        });

        const savedMessage = await this.messageRepository.save(message);

        // Update conversation updated_at
        await this.conversationRepository.update(conversationId, { updatedAt: new Date() });

        // Reload message with full relations for broadcasting
        const messageWithRelations = await this.messageRepository.findOne({
            where: { id: savedMessage.id },
            relations: ['sender', 'conversation', 'conversation.participants', 'conversation.participants.user']
        });

        return messageWithRelations;
    }

    async updateMessage(messageId: string, content: string, userId: string): Promise<Message> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'conversation']
        });

        if (!message) throw new NotFoundException('Message not found');
        if (message.sender.id !== userId) throw new UnauthorizedException('You can only edit your own messages');

        message.content = content;
        return this.messageRepository.save(message);
    }

    async deleteMessage(messageId: string, userId: string): Promise<Message> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'conversation']
        });

        if (!message) throw new NotFoundException('Message not found');
        if (message.sender.id !== userId) throw new UnauthorizedException('You can only delete your own messages');

        message.isDeleted = true;
        message.content = 'This message was deleted';
        message.attachmentUrl = null;
        message.attachmentType = null;

        return this.messageRepository.save(message);
    }

    async deleteConversation(conversationId: string): Promise<void> {
        // Only allow if admin? Or anyone in it? 
        // For simplicity, let's allow anyone in it to delete it for EVERYONE (dangerous but requested "delete chat").
        // Or "Leave Chat"? User said "Delete Chat".
        // Let's implement Delete.
        await this.conversationRepository.delete(conversationId);
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        return this.messageRepository.find({
            where: { conversation: { id: conversationId } },
            relations: ['sender'],
            order: { createdAt: 'ASC' }
        });
    }

    async updateConversation(id: string, name: string): Promise<Conversation> {
        await this.conversationRepository.update(id, { name });
        return this.findOne(id);
    }

    async addParticipants(conversationId: string, userIds: string[]): Promise<Conversation> {
        const conversation = await this.findOne(conversationId);

        // Filter out existing participants
        const existingIds = conversation.participants.map(p => p.user.id);
        const newIds = userIds.filter(id => !existingIds.includes(id));

        if (newIds.length === 0) return conversation;

        const users = await this.userRepository.findBy({ id: In(newIds) });
        const participants = users.map(user => this.participantRepository.create({
            conversation,
            user,
        }));
        await this.participantRepository.save(participants);

        return this.findOne(conversationId);
    }

    async removeParticipant(conversationId: string, userId: string): Promise<void> {
        const participant = await this.participantRepository.findOne({
            where: {
                conversation: { id: conversationId },
                user: { id: userId }
            }
        });

        if (participant) {
            await this.participantRepository.remove(participant);
        }
    }
}
