import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('meetings')
@Controller('meetings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MeetingsController {
    constructor(private readonly meetingsService: MeetingsService) { }

    @Post()
    @Roles(UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Schedule a new meeting' })
    create(@Body() createMeetingDto: CreateMeetingDto, @CurrentUser() user: any) {
        return this.meetingsService.create(createMeetingDto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all meetings' })
    findAll() {
        return this.meetingsService.findAll();
    }

    @Get('my-meetings')
    @ApiOperation({ summary: 'Get meetings for the current user' })
    findMyMeetings(@CurrentUser() user: any) {
        return this.meetingsService.findByUser(user.id);
    }

    @Delete(':id')
    @Roles(UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Delete a meeting' })
    remove(@Param('id') id: string) {
        return this.meetingsService.remove(id);
    }
}
