import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UseGuards, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly chatService: ChatService,
        private readonly notificationsService: NotificationsService
    ) { }

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            client.join(`user_${userId}`);
            this.logger.log(`User ${userId} joined chat`);
        }
    }

    handleDisconnect(client: Socket) {
        // cleanup
    }

    @SubscribeMessage('joinConversation')
    handleJoinConversation(@MessageBody() conversationId: string, @ConnectedSocket() client: Socket) {
        client.join(`conversation_${conversationId}`);
        this.logger.log(`Client ${client.id} joined conversation ${conversationId}`);
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(@MessageBody() payload: { conversationId: string, content: string, senderId: string }, @ConnectedSocket() client: Socket) {
        const message = await this.chatService.sendMessage(payload.conversationId, payload.senderId, payload.content);
        this.broadcastNewMessage(message);
        return message;
    }

    broadcastNewMessage(message: any) {
        this.server.to(`conversation_${message.conversation.id}`).emit('newMessage', message);

        // Notify participants who are NOT looking at the chat (via Notifications namespace)
        if (message.conversation && message.conversation.participants) {
            message.conversation.participants.forEach(p => {
                if (p.user.id !== message.sender.id) {
                    this.notificationsService.notifyUser(
                        p.user.id,
                        'New Message',
                        `New message from ${message.sender.firstName}`,
                        'INFO',
                        { skipEmail: true, skipSlack: true }
                    );
                }
            });
        }
    }

    broadcastConversationUpdate(conversation: any) {
        this.server.to(`conversation_${conversation.id}`).emit('conversationUpdated', conversation);
    }

    broadcastParticipantsAdded(conversationId: string, conversation: any) {
        // We broadcast to the conversation room so existing members see it
        this.server.to(`conversation_${conversationId}`).emit('conversationUpdated', conversation);

        // We also need to notify the NEW users so they can fetch the conversation
        // Since they are not in the room yet (unless they joined just now), we target their user rooms
        // We can just rely on 'conversationUpdated' if we iterate users, but 'conversationUpdated' usually updates local state.
        // Let's iterate newly added participants and tell them they were added?
        // Actually, simplest is just to emit 'conversationUpdated' to the room AND to each new user's private room.
        conversation.participants.forEach(p => {
            this.server.to(`user_${p.user.id}`).emit('conversationUpdated', conversation);
        });
    }

    broadcastParticipantRemoved(conversationId: string, userId: string) {
        this.server.to(`conversation_${conversationId}`).emit('participantRemoved', { conversationId, userId });
        this.server.to(`user_${userId}`).emit('participantRemoved', { conversationId, userId });
    }

    broadcastMessageUpdated(message: any) {
        if (message.conversation) {
            this.server.to(`conversation_${message.conversation.id}`).emit('messageUpdated', message);
        }
    }

    broadcastMessageDeleted(messageId: string, conversationId: string) {
        this.server.to(`conversation_${conversationId}`).emit('messageDeleted', { messageId, conversationId });
    }

    broadcastConversationDeleted(conversationId: string, participantIds: string[]) {
        // notify all participants
        participantIds.forEach(id => {
            this.server.to(`user_${id}`).emit('conversationDeleted', { conversationId });
        });
    }
}
