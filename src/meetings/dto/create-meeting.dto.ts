import { IsString, IsNotEmpty, IsDateString, IsUUID, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreateMeetingDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    startTime: string;

    @IsDateString()
    endTime: string;

    @IsUrl()
    @IsOptional()
    meetingLink?: string;

    @IsUUID()
    @IsOptional()
    projectId?: string;

    @IsArray()
    @IsUUID(undefined, { each: true })
    @IsOptional()
    attendeeIds?: string[];
}
