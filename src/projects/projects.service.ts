import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignDeveloperDto } from './dto/assign-developer.dto';
import { User, UserRole } from '../entities/user.entity';
import { Project, ProjectStatus } from '../entities/project.entity';
import { ProjectAssignment } from '../entities/project-assignment.entity';

import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectAssignment)
    private readonly assignmentsRepository: Repository<ProjectAssignment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly activityService: ActivityService,
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
    return savedProject;
  }

  async findAll(userId: string, userRole: UserRole) {
    // Boss, PM, DevOps, and Superadmin can see all projects
    if ([UserRole.BOSS, UserRole.PROJECT_MANAGER, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole)) {
      return this.projectsRepository.find({
        relations: ['manager', 'creator', 'assignments', 'assignments.developer', 'documents'],
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

    // Others see nothing or limited view
    return [];
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['manager', 'creator', 'assignments', 'assignments.developer', 'documents'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access permissions
    const canAccess =
      [UserRole.BOSS, UserRole.PROJECT_MANAGER, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      project.managerId === userId ||
      project.assignments.some((a) => a.developerId === userId);

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string, userRole: UserRole) {
    const project = await this.findOne(id, userId, userRole);

    // Check if user is an assigned developer
    const isAssignedDeveloper =
      userRole === UserRole.DEVELOPER &&
      project.assignments &&
      project.assignments.some((a) => a.developerId === userId);

    // Only Boss, DevOps, Superadmin, PM (manager), or assigned Developer can update
    const canUpdate =
      [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS].includes(userRole) ||
      project.managerId === userId ||
      isAssignedDeveloper;

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this project');
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
    }

    return this.findOne(id, userId, userRole);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const project = await this.findOne(id, userId, userRole);

    // Only Boss or Superadmin can delete
    if (![UserRole.BOSS, UserRole.SUPERADMIN].includes(userRole)) {
      throw new ForbiddenException('You do not have permission to delete this project');
    }

    await this.projectsRepository.delete(id);

    return { message: 'Project deleted successfully' };
  }

  async assignDeveloper(
    projectId: string,
    assignDeveloperDto: AssignDeveloperDto,
    userId: string,
    userRole: UserRole,
  ) {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only PM (who manages the project), Boss, DevOps, or Superadmin can assign developers
    const canAssign =
      [UserRole.BOSS, UserRole.SUPERADMIN].includes(userRole) ||
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
    return savedAssignment;
  }

  async removeDeveloper(projectId: string, developerId: string, userId: string, userRole: UserRole) {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only PM (who manages the project), Boss, DevOps, or Superadmin can remove developers
    const canRemove =
      [UserRole.BOSS, UserRole.SUPERADMIN].includes(userRole) ||
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
}

