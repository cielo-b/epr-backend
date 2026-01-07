import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectComponent } from '../entities/project-component.entity';
import { CreateProjectComponentDto } from './dto/create-project-component.dto';
import { UpdateProjectComponentDto } from './dto/update-project-component.dto';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from './projects.service';
import { UserRole } from '../entities/user.entity';

import { User } from '../entities/user.entity';

@Injectable()
export class ProjectComponentsService {
    constructor(
        @InjectRepository(ProjectComponent)
        private readonly componentRepository: Repository<ProjectComponent>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly activityService: ActivityService,
        private readonly projectsService: ProjectsService,
    ) { }

    async create(projectId: string, createDto: CreateProjectComponentDto, userId: string, userRole: UserRole) {
        // ... implementation
        const project = await this.projectsService.findOne(projectId, userId, userRole);
        const isManager = project.managerId === userId;
        const canEdit = [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole);
        if (!canEdit && !isManager) throw new ForbiddenException('You do not have permission to add components to this project');

        const component = this.componentRepository.create({ ...createDto, projectId });
        const saved = await this.componentRepository.save(component);
        await this.activityService.logAction(userId, 'CREATE_COMPONENT', `Added component "${saved.name}" to project`, projectId);
        return saved;
    }

    async findAll(projectId: string, userId: string, userRole: UserRole) {
        await this.projectsService.findOne(projectId, userId, userRole);
        return this.componentRepository.find({
            where: { projectId },
            order: { createdAt: 'ASC' },
            relations: ['developers']
        });
    }

    async findOne(id: string) {
        const component = await this.componentRepository.findOne({ where: { id }, relations: ['developers'] });
        if (!component) throw new NotFoundException('Component not found');
        return component;
    }

    async update(id: string, updateDto: UpdateProjectComponentDto, userId: string, userRole: UserRole) {
        const component = await this.findOne(id);
        const project = await this.projectsService.findOne(component.projectId, userId, userRole);
        const isManager = project.managerId === userId;
        const canEdit = [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole);
        if (!canEdit && !isManager) throw new ForbiddenException('You do not have permission to update this component');

        await this.componentRepository.update(id, updateDto);
        await this.activityService.logAction(userId, 'UPDATE_COMPONENT', `Updated component "${component.name}"`, component.projectId);
        return this.findOne(id);
    }

    async remove(id: string, userId: string, userRole: UserRole) {
        const component = await this.findOne(id);
        const project = await this.projectsService.findOne(component.projectId, userId, userRole);
        const isManager = project.managerId === userId;
        const canDelete = [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS].includes(userRole) || isManager;
        if (!canDelete) throw new ForbiddenException('You do not have permission to delete this component');

        await this.componentRepository.delete(id);
        await this.activityService.logAction(userId, 'DELETE_COMPONENT', `Deleted component "${component.name}"`, component.projectId);
        return { message: 'Component deleted successfully' };
    }

    async assignDeveloper(id: string, developerId: string, userId: string, userRole: UserRole) {
        const component = await this.findOne(id);

        const project = await this.projectsService.findOne(component.projectId, userId, userRole);
        const isManager = project.managerId === userId;
        const canEdit = [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole);

        if (!canEdit && !isManager) {
            throw new ForbiddenException('You do not have permission to assign developers to this component');
        }

        const isAssignedToProject = project.assignments?.some(a => a.developerId === developerId);
        if (!isAssignedToProject) {
            throw new ForbiddenException('Developer must be assigned to the project first');
        }

        if (component.developers.some(d => d.id === developerId)) {
            return component;
        }

        const developer = await this.userRepository.findOne({ where: { id: developerId } });
        if (!developer) throw new NotFoundException("Developer not found");

        component.developers.push(developer);
        await this.componentRepository.save(component);

        await this.activityService.logAction(userId, 'ASSIGN_COMPONENT_DEV', `Assigned ${developer.firstName} to component "${component.name}"`, component.projectId);

        return component;
    }

    async removeDeveloper(id: string, developerId: string, userId: string, userRole: UserRole) {
        const component = await this.findOne(id);

        const project = await this.projectsService.findOne(component.projectId, userId, userRole);
        const isManager = project.managerId === userId;
        const canEdit = [UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole);

        if (!canEdit && !isManager) {
            throw new ForbiddenException('You do not have permission to remove developers from this component');
        }

        component.developers = component.developers.filter(d => d.id !== developerId);
        await this.componentRepository.save(component);

        await this.activityService.logAction(userId, 'REMOVE_COMPONENT_DEV', `Removed developer from component "${component.name}"`, component.projectId);

        return component;
    }
}
