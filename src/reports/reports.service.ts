import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { User, UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Report } from '../entities/report.entity';
import { Document } from '../entities/document.entity';

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
  ) {}

  async create(createReportDto: CreateReportDto, userId: string) {
    const report = this.reportsRepository.create({
      ...createReportDto,
      createdById: userId,
    });
    return this.reportsRepository.save(report);
  }

  async findAll(userId: string, userRole: UserRole, projectId?: string) {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    // Everyone can see all reports; no role filter
    return this.reportsRepository.find({
      where,
      relations: ['createdBy', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'project'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Everyone can view; no restrictions
    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto, userId: string, userRole: UserRole) {
    const report = await this.findOne(id, userId, userRole);

    // Only creator or Boss/Superadmin can update
    if (report.createdById !== userId && ![UserRole.BOSS, UserRole.SUPERADMIN].includes(userRole)) {
      throw new NotFoundException('Report not found or no permission to update');
    }

    await this.reportsRepository.update(id, updateReportDto as Partial<Report>);
    return this.findOne(id, userId, userRole);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const report = await this.findOne(id, userId, userRole);

    // Only the creator or Boss/Superadmin can delete
    if (report.createdById !== userId && ![UserRole.BOSS, UserRole.SUPERADMIN].includes(userRole)) {
      throw new NotFoundException('Report not found or no permission to delete');
    }

    await this.reportsRepository.delete(id);

    return { message: 'Report deleted successfully' };
  }

  async getProjectStatistics(projectId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['assignments', 'documents', 'reports'],
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
        developers: project.assignments.map((a) => ({
          id: a.developer.id,
          name: `${a.developer.firstName} ${a.developer.lastName}`,
          assignedAt: a.assignedAt,
        })),
      },
    };
  }

  async getSystemStatistics(userRole: UserRole) {
    if (![UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole)) {
      throw new NotFoundException('Access denied');
    }

    const [totalUsers, totalProjects, totalDocuments, totalReports] = await Promise.all([
      this.usersRepository.count(),
      this.projectsRepository.count(),
      this.documentsRepository.count(),
      this.reportsRepository.count(),
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

    return {
      overview: {
        totalUsers,
        totalProjects,
        totalDocuments,
        totalReports,
      },
      projectsByStatus: projectsByStatusRaw.map((item) => ({
        status: item.status as string,
        count: Number(item.count),
      })),
      usersByRole: usersByRoleRaw.map((item) => ({
        role: item.role as UserRole,
        count: Number(item.count),
      })),
    };
  }
}

