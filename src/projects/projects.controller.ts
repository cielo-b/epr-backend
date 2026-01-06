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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignDeveloperDto } from './dto/assign-developer.dto';
import { ProjectPulseDto } from './dto/project-pulse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user.id, user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects (filtered by role)' })
  findAll(@CurrentUser() user: any) {
    return this.projectsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.update(id, updateProjectDto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.remove(id, user.id, user.role);
  }

  @Post(':id/assign-developer')
  @ApiOperation({ summary: 'Assign developer to project (PM/Boss/DevOps only)' })
  assignDeveloper(
    @Param('id') projectId: string,
    @Body() assignDeveloperDto: AssignDeveloperDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.assignDeveloper(projectId, assignDeveloperDto, user.id, user.role);
  }

  @Delete(':id/developers/:developerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove developer from project (PM/Boss/DevOps only)' })
  removeDeveloper(
    @Param('id') projectId: string,
    @Param('developerId') developerId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.removeDeveloper(projectId, developerId, user.id, user.role);
  }
  @Post(':id/request-update')
  @ApiOperation({ summary: 'Request status update from assigned developers (PM/Boss/Superadmin only)' })
  requestUpdate(@Param('id') projectId: string, @CurrentUser() user: any) {
    return this.projectsService.requestUpdate(projectId, user.id, user.role);
  }

  @Post(':id/pulse')
  @ApiOperation({ summary: 'Developer sends a status pulse response' })
  sendPulse(@Param('id') projectId: string, @Body() pulseDto: ProjectPulseDto, @CurrentUser() user: any) {
    return this.projectsService.sendPulse(projectId, pulseDto, user.id, user.role);
  }
}

