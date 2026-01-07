import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Conversation,
            Message,
            ConversationParticipant,
            User
        ]),
        NotificationsModule
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService]
})
export class ChatModule { }
