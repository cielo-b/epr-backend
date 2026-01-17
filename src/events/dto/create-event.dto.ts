import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EventType {
    WORSHIP = 'WORSHIP',
    MEETING = 'MEETING',
    CONFERENCE = 'CONFERENCE',
    RETREAT = 'RETREAT',
    TRAINING = 'TRAINING',
    YOUTH_EVENT = 'YOUTH_EVENT',
    WOMENS_EVENT = 'WOMENS_EVENT',
    MENS_EVENT = 'MENS_EVENT',
    CHILDRENS_EVENT = 'CHILDRENS_EVENT',
    BAPTISM = 'BAPTISM',
    WEDDING = 'WEDDING',
    FUNERAL = 'FUNERAL',
    OTHER = 'OTHER',
}

export enum EventStatus {
    PLANNED = 'PLANNED',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    POSTPONED = 'POSTPONED',
}

export class CreateEventDto {
    @ApiProperty({ description: 'Event title' })
    @IsString()
    title: string;

    @ApiPropertyOptional({ description: 'Event description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: EventType, description: 'Event type' })
    @IsEnum(EventType)
    type: EventType;

    @ApiProperty({ description: 'Start date and time' })
    @IsDateString()
    startDate: Date;

    @ApiProperty({ description: 'End date and time' })
    @IsDateString()
    endDate: Date;

    @ApiPropertyOptional({ description: 'Location/Venue' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Parish ID' })
    @IsOptional()
    @IsString()
    parishId?: string;

    @ApiPropertyOptional({ description: 'Presbytery ID' })
    @IsOptional()
    @IsString()
    presbyteryId?: string;

    @ApiPropertyOptional({ description: 'Community ID' })
    @IsOptional()
    @IsString()
    communityId?: string;

    @ApiPropertyOptional({ description: 'Organizer name' })
    @IsOptional()
    @IsString()
    organizer?: string;

    @ApiPropertyOptional({ description: 'Organizer contact' })
    @IsOptional()
    @IsString()
    organizerContact?: string;

    @ApiPropertyOptional({ description: 'Expected attendees' })
    @IsOptional()
    @IsNumber()
    expectedAttendees?: number;

    @ApiPropertyOptional({ description: 'Budget amount' })
    @IsOptional()
    @IsNumber()
    budget?: number;

    @ApiPropertyOptional({ enum: EventStatus, description: 'Event status', default: EventStatus.PLANNED })
    @IsOptional()
    @IsEnum(EventStatus)
    status?: EventStatus;

    @ApiPropertyOptional({ description: 'Is recurring event', default: false })
    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @ApiPropertyOptional({ description: 'Recurrence pattern (daily, weekly, monthly)' })
    @IsOptional()
    @IsString()
    recurrencePattern?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Speakers/Ministers', type: 'array' })
    @IsOptional()
    @IsArray()
    speakers?: string[];
}
