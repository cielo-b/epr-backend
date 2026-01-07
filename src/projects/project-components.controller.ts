import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectComponentsService } from './project-components.service';
import { CreateProjectComponentDto } from './dto/create-project-component.dto';
import { UpdateProjectComponentDto } from './dto/update-project-component.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('project-components')
@Controller('project-components')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectComponentsController {
    constructor(private readonly componentsService: ProjectComponentsService) { }

    @Post(':projectId')
    @ApiOperation({ summary: 'Create a new component for a project' })
    create(
        @Param('projectId') projectId: string,
        @Body() createDto: CreateProjectComponentDto,
        @CurrentUser() user: any,
    ) {
        return this.componentsService.create(projectId, createDto, user.id, user.role);
    }

    @Get('project/:projectId')
    @ApiOperation({ summary: 'Get all components for a project' })
    findAll(
        @Param('projectId') projectId: string,
        @CurrentUser() user: any,
    ) {
        return this.componentsService.findAll(projectId, user.id, user.role);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get component by ID' })
    findOne(@Param('id') id: string) {
        return this.componentsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update component' })
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateProjectComponentDto,
        @CurrentUser() user: any,
    ) {
        return this.componentsService.update(id, updateDto, user.id, user.role);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete component' })
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.componentsService.remove(id, user.id, user.role);
    }

    @Post(':id/developers/:developerId')
    @ApiOperation({ summary: 'Assign a developer to a component' })
    assignDeveloper(
        @Param('id') id: string,
        @Param('developerId') developerId: string,
        @CurrentUser() user: any,
    ) {
        return this.componentsService.assignDeveloper(id, developerId, user.id, user.role);
    }

    @Delete(':id/developers/:developerId')
    @ApiOperation({ summary: 'Remove a developer from a component' })
    removeDeveloper(
        @Param('id') id: string,
        @Param('developerId') developerId: string,
        @CurrentUser() user: any,
    ) {
        return this.componentsService.removeDeveloper(id, developerId, user.id, user.role);
    }
}
