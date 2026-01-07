import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignDeveloperDto } from './dto/assign-developer.dto';
import { User, UserRole } from '../entities/user.entity';
import { Project, ProjectStatus } from '../entities/project.entity';
import { ProjectAssignment } from '../entities/project-assignment.entity';
import { Document } from '../entities/document.entity';
import { ProjectPulseDto } from './dto/project-pulse.dto';

import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';

import { UserPermission, PermissionResource, PermissionAction } from '../entities/user-permission.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectAssignment)
    private readonly assignmentsRepository: Repository<ProjectAssignment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(UserPermission)
    private readonly permissionsRepository: Repository<UserPermission>,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(createProjectDto: CreateProjectDto, userId: string, userRole: UserRole) {
    // Only PM, Boss, DevOps, and Superadmin can create projects
    const allowedRoles = [UserRole.PROJECT_MANAGER, UserRole.BOSS, UserRole.SUPERADMIN];

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to create projects');
    }

    // If managerId is not provided, use the creator as manager
    const managerId = createProjectDto.managerId || userId;

    const project = this.projectsRepository.create({
      ...createProjectDto,
      managerId,
      creatorId: userId,
    });
    const savedProject = await this.projectsRepository.save(project);
    await this.activityService.logAction(userId, 'CREATE_PROJECT', `Created project "${savedProject.name}"`, savedProject.id);

    // Notify the project manager if they're not the creator
    if (managerId !== userId) {
      await this.notificationsService.notifyUser(
        managerId,
        `New Project Assigned: ${savedProject.name}`,
        `You have been assigned as the manager of a new project.\n\nProject: ${savedProject.name}\nStatus: ${savedProject.status}`,
        'INFO'
      );
    }

    return savedProject;
  }

  async findAll(userId: string, userRole: UserRole) {
    // Boss, PM, DevOps, Superadmin, and Secretary can see all projects
    if ([UserRole.BOSS, UserRole.PROJECT_MANAGER, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.SECRETARY].includes(userRole)) {
      return this.projectsRepository.find({
        relations: ['manager', 'creator', 'assignments', 'assignments.developer', 'documents', 'devServer', 'productionServer'],
        order: { createdAt: 'DESC' },
      });
    }

    // Developers can see projects they're assigned to
    if (userRole === UserRole.DEVELOPER) {
      return this.projectsRepository
        .createQueryBuilder('project')
        .leftJoinAndSelect('project.manager', 'manager')
        .leftJoinAndSelect('project.assignments', 'assignment')
        .leftJoinAndSelect('assignment.developer', 'developer')
        .leftJoinAndSelect('project.documents', 'document')
        .where('assignment.developerId = :userId', { userId })
        .orderBy('project.createdAt', 'DESC')
        .getMany();
    }

    // Check custom permissions for others (e.g. VISITOR)
    const permissions = await this.permissionsRepository.find({
      where: {
        userId,
        resource: PermissionResource.PROJECT,
        action: PermissionAction.VIEW
      }
    });

    if (permissions.length > 0) {
      const allProjectsPermission = permissions.find(p => !p.resourceId);

      if (allProjectsPermission) {
        return this.projectsRepository.find({
          relations: ['manager', 'creator', 'assignments', 'assignments.developer', 'documents', 'devServer', 'productionServer'],
          order: { createdAt: 'DESC' },
        });
      }

      const projectIds = permissions.map(p => p.resourceId).filter(id => id !== null);
      if (projectIds.length > 0) {
        return this.projectsRepository.createQueryBuilder('project')
          .leftJoinAndSelect('project.manager', 'manager')
          .leftJoinAndSelect('project.assignments', 'assignment')
          .leftJoinAndSelect('assignment.developer', 'developer')
          .leftJoinAndSelect('project.documents', 'document')
          .where('project.id IN (:...projectIds)', { projectIds })
          .orderBy('project.createdAt', 'DESC')
          .getMany();
      }
    }

    // Others see nothing
    return [];
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['manager', 'creator', 'assignments', 'assignments.developer', 'documents', 'devServer', 'productionServer'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access permissions

    // 1. Role-based access
    if ([UserRole.BOSS, UserRole.PROJECT_MANAGER, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.SECRETARY].includes(userRole)) {
      return project;
    }

    // 2. Project ownership/assignment
    if (project.managerId === userId || project.assignments.some((a) => a.developerId === userId)) {
      return project;
    }

    // 3. Custom permissions (e.g. VISITOR)
    const permissions = await this.permissionsRepository.find({
      where: {
        userId,
        resource: PermissionResource.PROJECT,
        action: PermissionAction.VIEW
      }
    });

    const hasPermission = permissions.some(p => !p.resourceId || p.resourceId === id);

    if (hasPermission) {
      return project;
    }

    throw new ForbiddenException('You do not have access to this project');
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string, userRole: UserRole) {
    const project = await this.findOne(id, userId, userRole);

    // Check if user is an assigned developer
    const isAssignedDeveloper =
      userRole === UserRole.DEVELOPER &&
      project.assignments &&
      project.assignments.some((a) => a.developerId === userId);

    // Only Boss, DevOps, Superadmin, PM (manager) can update general project details.
    // Developers are restricted from general project updates but CAN update the envTemplate if assigned.
    const isManagerOrAdmin =
      [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS].includes(userRole) ||
      project.managerId === userId;

    let canUpdate = isManagerOrAdmin;

    // Special allowance for assigned developers to update the environment template (Vault)
    if (!canUpdate && isAssignedDeveloper) {
      const updateKeys = Object.keys(updateProjectDto);
      if (updateKeys.length === 1 && updateKeys[0] === 'envTemplate') {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this project details');
    }

    const data = { ...updateProjectDto } as unknown as Partial<Project>;

    if (updateProjectDto.startDate) {
      data.startDate = new Date(updateProjectDto.startDate as any);
    }

    if (updateProjectDto.endDate) {
      data.endDate = new Date(updateProjectDto.endDate as any);
    }

    await this.projectsRepository.update(id, data);

    // Detailed logging
    const changes: string[] = [];
    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      changes.push(`name to "${updateProjectDto.name}"`);
    }
    if (updateProjectDto.status && updateProjectDto.status !== project.status) {
      changes.push(`status from ${project.status} to ${updateProjectDto.status}`);
    }
    if (updateProjectDto.githubUrl && updateProjectDto.githubUrl !== project.githubUrl) {
      changes.push(`GitHub URL`);
    }
    if (updateProjectDto.deployUrl && updateProjectDto.deployUrl !== project.deployUrl) {
      changes.push(`Deployment URL`);
    }
    if (updateProjectDto.serverDetails && updateProjectDto.serverDetails !== project.serverDetails) {
      changes.push(`Server Details`);
    }

    if (changes.length > 0) {
      await this.activityService.logAction(userId, 'UPDATE_PROJECT', `Updated ${changes.join(', ')}`, id);

      // Notify project manager and all assigned developers about the update
      const updatedProject = await this.projectsRepository.findOne({
        where: { id },
        relations: ['manager', 'assignments', 'assignments.developer'],
      });

      if (updatedProject) {
        const usersToNotify = new Set<string>();

        // Add manager
        if (updatedProject.managerId) {
          usersToNotify.add(updatedProject.managerId);
        }

        // Add all assigned developers
        updatedProject.assignments?.forEach(assignment => {
          if (assignment.developerId) {
            usersToNotify.add(assignment.developerId);
          }
        });

        // Send notifications
        for (const targetUserId of usersToNotify) {
          await this.notificationsService.notifyUser(
            targetUserId,
            `Project Updated: ${updatedProject.name}`,
            `The project "${updatedProject.name}" has been updated.\n\nChanges: ${changes.join(', ')}`,
            'INFO'
          );
        }
      }
    }

    // Auto-archive documents if project is completed
    if (updateProjectDto.status === ProjectStatus.COMPLETED && project.status !== ProjectStatus.COMPLETED) {
      await this.documentsRepository.update(
        { projectId: id, isArchived: false },
        { isArchived: true, archivedAt: new Date() }
      );
      await this.activityService.logAction(userId, 'ARCHIVE_DOCUMENTS', 'Auto-archived project documents', id);
    }

    return this.findOne(id, userId, userRole);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const project = await this.findOne(id, userId, userRole);

    // Only Boss or Superadmin can delete
    if (![UserRole.BOSS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole)) {
      throw new ForbiddenException('You do not have permission to delete this project');
    }

    await this.projectsRepository.delete(id);
    await this.activityService.logAction(userId, 'DELETE_PROJECT', `Deleted project "${project.name}"`);
    return { message: 'Project deleted successfully' };
  }

  async assignDeveloper(
    projectId: string,
    assignDeveloperDto: AssignDeveloperDto,
    userId: string,
    userRole: UserRole,
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['manager'] // Load manager to display name in notification
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only PM (who manages the project), Boss, DevOps, or Superadmin can assign developers
    const canAssign =
      [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      (userRole === UserRole.PROJECT_MANAGER && project.managerId === userId);

    if (!canAssign) {
      throw new ForbiddenException('You do not have permission to assign developers to this project');
    }

    // Verify the developer exists and has DEVELOPER role
    const developer = await this.usersRepository.findOne({
      where: { id: assignDeveloperDto.developerId },
    });

    if (!developer || developer.role !== UserRole.DEVELOPER) {
      throw new NotFoundException('Developer not found');
    }

    // Check if already assigned
    const existingAssignment = await this.assignmentsRepository.findOne({
      where: {
        projectId,
        developerId: assignDeveloperDto.developerId,
      },
    });

    if (existingAssignment) {
      throw new ForbiddenException('Developer is already assigned to this project');
    }

    const assignment = this.assignmentsRepository.create({
      projectId,
      developerId: assignDeveloperDto.developerId,
      assignedById: userId,
      notes: assignDeveloperDto.notes,
    });
    const savedAssignment = await this.assignmentsRepository.save(assignment);
    await this.activityService.logAction(userId, 'ASSIGN_DEVELOPER', `Assigned developer ${developer.firstName} ${developer.lastName}`, projectId);

    // Notify the developer about the assignment
    await this.notificationsService.notifyUser(
      developer.id,
      `New Project Assignment: ${project.name}`,
      `Hello ${developer.firstName} ${developer.lastName},\n\nYou have been assigned to a new project.\n\nProject: ${project.name}\nStatus: ${project.status}\nManager: ${project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Not assigned'}`,
      'INFO'
    );

    return savedAssignment;
  }

  async removeDeveloper(projectId: string, developerId: string, userId: string, userRole: UserRole) {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only PM (who manages the project), Boss, DevOps, or Superadmin can remove developers
    const canRemove =
      [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      (userRole === UserRole.PROJECT_MANAGER && project.managerId === userId);

    if (!canRemove) {
      throw new ForbiddenException('You do not have permission to remove developers from this project');
    }

    await this.assignmentsRepository.delete({
      projectId,
      developerId,
    });

    await this.activityService.logAction(userId, 'REMOVE_DEVELOPER', `Removed developer from project`, projectId);

    return { message: 'Developer removed from project successfully' };
  }

  async requestUpdate(projectId: string, userId: string, userRole: UserRole) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['manager', 'assignments', 'assignments.developer'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only Manager, Boss, or Superadmin can request updates
    const canRequest =
      [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      project.managerId === userId;

    if (!canRequest) {
      throw new ForbiddenException('You do not have permission to request updates for this project');
    }

    const assignedDevelopers = project.assignments?.map(a => a.developerId) || [];

    for (const devId of assignedDevelopers) {
      await this.notificationsService.notifyUser(
        devId,
        `Update Requested: ${project.name}`,
        `A status update has been requested for the project "${project.name}" by the project manager.`,
        'INFO'
      );
    }

    await this.activityService.logAction(userId, 'REQUEST_UPDATE', `Requested status update from team`, projectId);

    return { message: `Update request sent to ${assignedDevelopers.length} developers` };
  }

  async sendPulse(projectId: string, pulseDto: ProjectPulseDto, userId: string, userRole: UserRole) {
    const project = await this.findOne(projectId, userId, userRole);

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    const manager = await this.usersRepository.findOne({ where: { id: project.managerId } });

    const statusLabel = pulseDto.status.replace('_', ' ');
    const message = pulseDto.message ? `: ${pulseDto.message}` : '';
    const description = `Pulse from ${user?.firstName}: Project is ${statusLabel}${message}`;

    await this.activityService.logAction(userId, 'PROJECT_PULSE', description, projectId);

    if (manager) {
      await this.notificationsService.notifyUser(
        manager.id,
        `Status Pulse: ${project.name}`,
        description,
        'INFO'
      );
    }

    return { message: 'Pulse sent successfully' };
  }
}

