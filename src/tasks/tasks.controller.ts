import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TaskStatus } from '../entities/task.entity';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new task' })
    create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: any) {
        return this.tasksService.create(createTaskDto, user.id, user.role);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tasks' })
    @ApiQuery({ name: 'projectId', required: false })
    @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
    findAll(
        @CurrentUser() user: any,
        @Query('projectId') projectId?: string,
        @Query('status') status?: TaskStatus,
        @Query('assigneeId') assigneeId?: string,
    ) {
        return this.tasksService.findAll(user.id, user.role, projectId, status, assigneeId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific task' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.tasksService.findOne(id, user.id, user.role);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a task' })
    update(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @CurrentUser() user: any,
    ) {
        return this.tasksService.update(id, updateTaskDto, user.id, user.role);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a task' })
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.tasksService.remove(id, user.id, user.role);
    }
}
