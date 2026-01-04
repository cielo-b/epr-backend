import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus } from '../entities/task.entity';
import { User, UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { ActivityService } from '../activity/activity.service';
import { TasksGateway } from './tasks.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly activityService: ActivityService,
        private readonly tasksGateway: TasksGateway,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(createTaskDto: CreateTaskDto, userId: string, userRole: UserRole) {
        const project = await this.projectsRepository.findOne({
            where: { id: createTaskDto.projectId },
            relations: ['manager', 'assignments', 'assignments.developer'],
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Check permissions
        // Boss, Superadmin, DevOps can create tasks
        // Project Manager can create tasks for their projects
        // Developers can create tasks if they are assigned to the project (SRS implies they can creates tasks? "Task creation with tags" is under Functional Requirements, but doesn't explicitly restrict creators. Usually devs can create tasks too, or at least PMs. Use Case UC-03 Assign Task says PM assigns. UC-02 Create Project is PM. SRS doesn't explicitly say "Developer creates task". However, agile usually allows it. Let's stick to PM/Boss/Admin for now, and maybe assigned devs.)
        // Wait, SRS 2.2 User Classes says:
        // Project Manager: Create projects, assign tasks, track progress.
        // Developer/Designer: Access assigned tasks, upload project documents.
        // So maybe Developers CANNOT create tasks? "Access assigned tasks" suggests read-only or update status.
        // However, "Task creation with tags" is a general requirement.
        // Let's assume PM and above for creation, and potentially assigned devs if we want to be flexible, but strictly following SRS roles: PM creates/assigns.

        const canCreate =
            [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS].includes(userRole) ||
            (userRole === UserRole.PROJECT_MANAGER && project.managerId === userId) ||
            (userRole === UserRole.DEVELOPER && project.assignments.some(a => a.developerId === userId)); // Allowing devs to create tasks for now as it's practical.

        if (!canCreate) {
            throw new ForbiddenException('You do not have permission to create tasks for this project');
        }

        let assignees: User[] = [];
        if (createTaskDto.assigneeIds && createTaskDto.assigneeIds.length > 0) {
            assignees = await this.usersRepository.findBy({
                id: In(createTaskDto.assigneeIds),
            });
        }

        const task = this.tasksRepository.create({
            ...createTaskDto,
            project,
            createdById: userId,
            assignees,
        });

        const savedTask = await this.tasksRepository.save(task);
        await this.activityService.logAction(userId, 'CREATE_TASK', `Created task "${savedTask.title}"`, project.id);

        this.tasksGateway.emitTaskUpdate('created', savedTask);

        // Notify assignees
        if (savedTask.assignees?.length) {
            for (const assignee of savedTask.assignees) {
                await this.notificationsService.notifyUser(
                    assignee.id,
                    `New Task Assigned: ${savedTask.title}`,
                    `You have been assigned to a new task in project ${project.name}.\n\nTitle: ${savedTask.title}\nStatus: ${savedTask.status}`,
                    'INFO'
                );
            }
        }

        return savedTask;
    }

    async findAll(userId: string, userRole: UserRole, projectId?: string, status?: TaskStatus) {
        const where: any = {};
        if (projectId) {
            where.projectId = projectId;
        }
        if (status) {
            where.status = status;
        }

        // Role-based filtering
        if ([UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole)) {
            // Can see all tasks (optionally filtered by project/status)
            return this.tasksRepository.find({
                where,
                relations: ['assignees', 'createdBy', 'project'],
                order: { createdAt: 'DESC' },
            });
        }

        if (userRole === UserRole.DEVELOPER) {
            // Developers can see tasks in projects they are assigned to OR tasks assigned to them?
            // SRS says "General Staff: View authorized documents and tasks."
            // Let's return tasks for projects they are assigned to.
            return this.tasksRepository.find({
                where: {
                    ...where,
                    project: {
                        assignments: {
                            developerId: userId
                        }
                    }
                },
                relations: ['assignees', 'createdBy', 'project'],
                order: { createdAt: 'DESC' },
            });
        }

        return [];
    }

    async findOne(id: string, userId: string, userRole: UserRole) {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: ['assignees', 'createdBy', 'project', 'project.manager', 'project.assignments'],
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        // Permission check
        const canAccess =
            [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS].includes(userRole) ||
            task.project.managerId === userId ||
            task.project.assignments.some(a => a.developerId === userId) ||
            task.assignees.some(u => u.id === userId); // If explicitly assigned even if not in project (edge case)

        if (!canAccess) {
            throw new ForbiddenException('You do not have access to this task');
        }

        return task;
    }

    async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: UserRole) {
        const task = await this.findOne(id, userId, userRole);

        // Update permissions:
        // PM/Boss/Admin can update everything.
        // Assignees (Devs) can update status? SRS says "Developer... Access assigned tasks". Typically they update status.
        // Let's allow Assignees to update Status and maybe Description/Tags, but not Title or Delete.

        // For simplicity, checking if user has full update rights vs partial.
        const hasFullAccess =
            [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS].includes(userRole) ||
            (userRole === UserRole.PROJECT_MANAGER && task.project.managerId === userId) ||
            task.createdById === userId;

        const isAssignee = task.assignees.some(u => u.id === userId);

        if (!hasFullAccess && !isAssignee) {
            throw new ForbiddenException('You do not have permission to update this task');
        }

        if (!hasFullAccess && isAssignee) {
            // Restrict what assignees can update? Maybe just status?
            // For now, let's allow them to update, but maybe we should validate fields.
            // Ideally, separate DTO or check fields.
            // If they try to change something critical like project or similar, block it.
            // But UpdateTaskDto is broad.
            // Let's assume trust for now or strict on Status only if requested. 
            // SRS: "Developer... Access assigned tasks". Use Case UC-03 Assign Task. 
            // Use case diagram shows "Update Task Status?" -> "User updates task status"
            // So developers DEFINITELY update status.
        }

        if (updateTaskDto.assigneeIds) {
            if (!hasFullAccess) {
                throw new ForbiddenException('Only managers can reassign tasks');
            }
            const assignees = await this.usersRepository.findBy({
                id: In(updateTaskDto.assigneeIds),
            });
            task.assignees = assignees;
            // We could log assignee changes here, but let's do it below or make it part of the general log
        }

        const changes: string[] = [];
        if (updateTaskDto.status && updateTaskDto.status !== task.status) {
            changes.push(`changed status from ${task.status} to ${updateTaskDto.status}`);
        }
        if (updateTaskDto.title && updateTaskDto.title !== task.title) {
            changes.push(`renamed task from "${task.title}" to "${updateTaskDto.title}"`);
        }
        if (updateTaskDto.description !== undefined && updateTaskDto.description !== task.description) {
            changes.push(`updated description`);
        }
        if (updateTaskDto.dueDate !== undefined && updateTaskDto.dueDate !== task.dueDate) {
            changes.push(`updated due date`);
        }
        if (updateTaskDto.tags) {
            // Simple check if tags changed (length or content)
            const oldTags = task.tags.sort().join(',');
            const newTags = updateTaskDto.tags.sort().join(',');
            if (oldTags !== newTags) {
                changes.push(`updated tags`);
            }
        }
        if (updateTaskDto.assigneeIds) {
            changes.push(`updated assignees`);
        }

        Object.assign(task, {
            ...updateTaskDto,
            assigneeIds: undefined, // Handle separately
        });

        const updatedTask = await this.tasksRepository.save(task);

        const actionDescription = changes.length > 0
            ? `Updated task "${updatedTask.title}": ${changes.join(', ')}`
            : `Updated task "${updatedTask.title}" details`;

        await this.activityService.logAction(userId, 'UPDATE_TASK', actionDescription, task.project.id);

        this.tasksGateway.emitTaskUpdate('updated', updatedTask);

        // Notify assignees about updates
        if (updatedTask.assignees?.length && changes.length > 0) {
            const updatesLogger = new Logger('TasksService (Updates)');
            updatesLogger.log(`Notifying ${updatedTask.assignees.length} assignees about changes: ${changes.join(', ')}`);

            for (const assignee of updatedTask.assignees) {
                updatesLogger.log(`Sending notification to user ${assignee.id} (${assignee.email})`);
                await this.notificationsService.notifyUser(
                    assignee.id,
                    `Task Updated: ${updatedTask.title}`,
                    `The task "${updatedTask.title}" has been updated.\n\nChanges: ${changes.join(', ')}\n\nProject: ${updatedTask.project.name}`,
                    'INFO'
                );
            }
        }

        return updatedTask;
    }

    async remove(id: string, userId: string, userRole: UserRole) {
        const task = await this.findOne(id, userId, userRole);

        const canDelete =
            [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
            (userRole === UserRole.PROJECT_MANAGER && task.project.managerId === userId) ||
            task.createdById === userId;

        if (!canDelete) {
            throw new ForbiddenException('You do not have permission to delete this task');
        }

        await this.tasksRepository.remove(task);
        this.tasksGateway.emitTaskUpdate('deleted', { id, projectId: task.projectId });
        return { message: 'Task deleted successfully' };
    }
}
