import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { User, UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Report } from '../entities/report.entity';
import { Document, ConfidentialityLevel } from '../entities/document.entity';
import { Task, TaskStatus } from '../entities/task.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(createReportDto: CreateReportDto, userId: string) {
    const report = this.reportsRepository.create({
      ...createReportDto,
      createdById: userId,
      confidentiality: (createReportDto.confidentiality as 'CONFIDENTIAL' | 'PUBLIC') || ConfidentialityLevel.PUBLIC,
    });
    const saved = await this.reportsRepository.save(report);

    // Notify Project Manager and Team if linked to project
    if (saved.projectId) {
      const project = await this.projectsRepository.findOne({
        where: { id: saved.projectId },
        relations: ['manager', 'assignments', 'assignments.developer', 'creator']
      });

      if (project) {
        const usersToNotify = new Set<string>();
        if (project.managerId && project.managerId !== userId) usersToNotify.add(project.managerId);
        project.assignments?.forEach(a => {
          if (a.developerId && a.developerId !== userId) usersToNotify.add(a.developerId);
        });

        for (const targetId of usersToNotify) {
          await this.notificationsService.notifyUser(
            targetId,
            `New Report: ${saved.title}`,
            `A new report has been submitted for project "${project.name}".`,
            'INFO'
          );
        }
      }
    }

    return saved;
  }

  async findAll(userId: string, userRole: UserRole, projectId?: string) {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    let reports = await this.reportsRepository.find({
      where,
      relations: ['createdBy', 'project'],
      order: { createdAt: 'DESC' },
    });

    // Confidentiality Filtering
    reports = reports.filter(report => {
      // High privilege or Creator always sees it
      if ([UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole)) return true;
      if (report.createdById === userId) return true;

      // Confidential check
      if (report.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
        return false;
      }

      // If Public, everyone sees it.
      return true;
    });

    return reports;
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'project'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // High privilege or Creator always allowed
    if ([UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole)) {
      return report;
    }
    if (report.createdById === userId) {
      return report;
    }

    // Confidentiality Check
    if (report.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
      throw new ForbiddenException('This report is confidential.');
    }

    // Visitors/Public users can see Public reports
    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto, userId: string, userRole: UserRole) {
    const report = await this.findOne(id, userId, userRole);

    // Only creator or Boss/Superadmin/PM can update
    if (report.createdById !== userId && ![UserRole.BOSS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole)) {
      throw new NotFoundException('Report not found or no permission to update');
    }

    await this.reportsRepository.update(id, updateReportDto as Partial<Report>);
    return this.findOne(id, userId, userRole);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const report = await this.findOne(id, userId, userRole);

    // Only the creator or Boss/Superadmin/PM can delete
    if (report.createdById !== userId && ![UserRole.BOSS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole)) {
      throw new NotFoundException('Report not found or no permission to delete');
    }

    await this.reportsRepository.delete(id);

    return { message: 'Report deleted successfully' };
  }

  async getProjectStatistics(projectId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['assignments', 'documents', 'reports', 'tasks'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
      },
      statistics: {
        totalDevelopers: project.assignments.length,
        totalDocuments: project.documents.length,
        totalReports: project.reports.length,
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
        taskCompletionRate:
          project.tasks.length > 0
            ? (project.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length /
              project.tasks.length) *
            100
            : 0,
        tasksByStatus: project.tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        developers: project.assignments.map((a) => ({
          id: a.developer.id,
          name: `${a.developer.firstName} ${a.developer.lastName}`,
          assignedAt: a.assignedAt,
        })),
      },
    };
  }

  async getSystemStatistics(userRole: UserRole) {
    if (![UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole)) {
      throw new NotFoundException('Access denied');
    }

    const [totalUsers, totalProjects, totalDocuments, totalReports, totalTasks] = await Promise.all([
      this.usersRepository.count(),
      this.projectsRepository.count(),
      this.documentsRepository.count(),
      this.reportsRepository.count(),
      this.tasksRepository.count(),
    ]);

    const projectsByStatusRaw = await this.projectsRepository
      .createQueryBuilder('project')
      .select('project.status', 'status')
      .addSelect('COUNT(project.id)', 'count')
      .groupBy('project.status')
      .getRawMany();

    const usersByRoleRaw = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const tasksByStatusRaw = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(task.id)', 'count')
      .groupBy('task.status')
      .getRawMany();

    return {
      overview: {
        totalUsers,
        totalProjects,
        totalDocuments,
        totalReports,
        totalTasks,
      },
      projectsByStatus: projectsByStatusRaw.map((item) => ({
        status: item.status as string,
        count: Number(item.count),
      })),
      usersByRole: usersByRoleRaw.map((item) => ({
        role: item.role as UserRole,
        count: Number(item.count),
      })),
      tasksByStatus: tasksByStatusRaw.map((item) => ({
        status: item.status as string,
        count: Number(item.count),
      })),
    };
  }

  async getPersonalStatistics(userId: string) {
    const [assignedProjectsCount, assignedTasksCount] = await Promise.all([
      this.projectsRepository.count({
        where: { assignments: { developerId: userId } }
      }),
      this.tasksRepository.count({
        where: { assignees: { id: userId } }
      })
    ]);

    const tasksByStatusRaw = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignees', 'assignee')
      .select('task.status', 'status')
      .addSelect('COUNT(task.id)', 'count')
      .where('assignee.id = :userId', { userId })
      .groupBy('task.status')
      .getRawMany();

    return {
      overview: {
        assignedProjects: assignedProjectsCount,
        assignedTasks: assignedTasksCount,
      },
      tasksByStatus: tasksByStatusRaw.map((item) => ({
        status: item.status as string,
        count: Number(item.count),
      })),
    };
  }
}
