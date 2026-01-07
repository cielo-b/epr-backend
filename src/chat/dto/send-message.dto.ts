import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class SendMessageDto {
    @IsOptional()
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @IsOptional()
    @IsString()
    attachmentType?: string;

    @IsNotEmpty()
    @IsUUID()
    conversationId: string;
}
