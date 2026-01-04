import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            client.join(`user_${userId}`);
            this.logger.log(`User ${userId} joined notification room`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected from notifications: ${client.id}`);
    }

    sendToUser(userId: string, payload: any) {
        this.logger.log(`Emitting notification to room user_${userId}`);
        this.server.to(`user_${userId}`).emit('notification', payload);
    }
}
