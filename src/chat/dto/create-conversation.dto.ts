import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class CreateConversationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsBoolean()
    isGroup?: boolean;

    @IsArray()
    @IsUUID('all', { each: true })
    participantIds: string[];
}
