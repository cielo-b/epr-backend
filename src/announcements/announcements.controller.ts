import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @Post()
    @Roles(UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Create a project announcement' })
    create(@Body() createAnnouncementDto: CreateAnnouncementDto, @CurrentUser() user: any) {
        return this.announcementsService.create(createAnnouncementDto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all announcements' })
    findAll(@CurrentUser() user: any) {
        return this.announcementsService.findAll(user);
    }

    @Get('recent')
    @ApiOperation({ summary: 'Get recent announcements' })
    findRecent(@Query('limit') limit: number, @CurrentUser() user: any) {
        return this.announcementsService.findRecent(limit, user);
    }

    @Get('project/:projectId')
    @ApiOperation({ summary: 'Get announcements for a specific project' })
    findByProject(@Param('projectId') projectId: string, @CurrentUser() user: any) {
        return this.announcementsService.findByProject(projectId, user);
    }

    @Delete(':id')
    @Roles(UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN, UserRole.SECRETARY)
    @ApiOperation({ summary: 'Delete an announcement' })
    remove(@Param('id') id: string) {
        return this.announcementsService.remove(id);
    }
}
