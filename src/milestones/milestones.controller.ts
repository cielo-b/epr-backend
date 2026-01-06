import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto/milestone.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('milestones')
@Controller('milestones')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MilestonesController {
    constructor(private readonly milestonesService: MilestonesService) { }

    @Post()
    @Roles(UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Create a project milestone' })
    create(@Body() createMilestoneDto: CreateMilestoneDto) {
        return this.milestonesService.create(createMilestoneDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all milestones' })
    findAll() {
        return this.milestonesService.findAll();
    }

    @Get('project/:projectId')
    @ApiOperation({ summary: 'Get milestones for a specific project' })
    findByProject(@Param('projectId') projectId: string) {
        return this.milestonesService.findByProject(projectId);
    }

    @Patch(':id')
    @Roles(UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Update a milestone' })
    update(@Param('id') id: string, @Body() updateMilestoneDto: UpdateMilestoneDto) {
        return this.milestonesService.update(id, updateMilestoneDto);
    }

    @Delete(':id')
    @Roles(UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Delete a milestone' })
    remove(@Param('id') id: string) {
        return this.milestonesService.remove(id);
    }
}
