import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Helper for file upload
const storage = diskStorage({
    destination: './uploads/chat',
    filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
    }
});

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly chatGateway: ChatGateway
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { storage }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            url: `/uploads/chat/${file.filename}`,
            type: file.mimetype
        };
    }

    @Post('conversations')
    async createConversation(@Request() req, @Body() createConversationDto: CreateConversationDto) {
        const conversation = await this.chatService.createConversation(createConversationDto, req.user.id);
        this.chatGateway.broadcastParticipantsAdded(conversation.id, conversation);
        return conversation;
    }

    @Get('conversations')
    getUserConversations(@Request() req) {
        return this.chatService.getUserConversations(req.user.id);
    }

    @Get('conversations/:id')
    getConversation(@Param('id') id: string) {
        return this.chatService.findOne(id);
    }

    @Delete('conversations/:id')
    async deleteConversation(@Param('id') id: string) {
        const conversation = await this.chatService.findOne(id);
        const participantIds = conversation.participants.map(p => p.user.id);
        await this.chatService.deleteConversation(id);
        this.chatGateway.broadcastConversationDeleted(id, participantIds);
        return { success: true };
    }

    @Post('messages')
    async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
        const message = await this.chatService.sendMessage(sendMessageDto.conversationId, req.user.id, sendMessageDto.content, sendMessageDto.attachmentUrl, sendMessageDto.attachmentType);
        this.chatGateway.broadcastNewMessage(message);
        return message;
    }

    @Patch('messages/:id')
    async updateMessage(@Request() req, @Param('id') id: string, @Body() body: { content: string }) {
        const message = await this.chatService.updateMessage(id, body.content, req.user.id);
        this.chatGateway.broadcastMessageUpdated(message);
        return message;
    }

    @Delete('messages/:id')
    async deleteMessage(@Request() req, @Param('id') id: string) {
        const updatedMsg = await this.chatService.deleteMessage(id, req.user.id);
        this.chatGateway.broadcastMessageUpdated(updatedMsg);
        return { success: true };
    }


    @Get('conversations/:id/messages')
    getMessages(@Param('id') id: string) {
        return this.chatService.getMessages(id);
    }

    @Patch('conversations/:id')
    async updateConversation(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
        if (updateConversationDto.name) {
            const conversation = await this.chatService.updateConversation(id, updateConversationDto.name);
            this.chatGateway.broadcastConversationUpdate(conversation);
            return conversation;
        }
    }

    @Post('conversations/:id/participants')
    async addParticipants(@Param('id') id: string, @Body() addParticipantsDto: AddParticipantsDto) {
        const conversation = await this.chatService.addParticipants(id, addParticipantsDto.userIds);
        this.chatGateway.broadcastParticipantsAdded(id, conversation);
        return conversation;
    }

    @Delete('conversations/:id/participants/:userId')
    async removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
        await this.chatService.removeParticipant(id, userId);
        this.chatGateway.broadcastParticipantRemoved(id, userId);
        return { success: true };
    }
}
