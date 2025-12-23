import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Document } from '../entities/document.entity';
import { Report } from '../entities/report.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

import { ActivityService } from '../activity/activity.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    private readonly activityService: ActivityService,
  ) { }

  private async saveFile(
    target: { projectId?: string; reportId?: string },
    file: Express.Multer.File,
    description: string | undefined,
    userId: string,
  ) {
    // Ensure upload directory exists
    const uploadDir = process.env.UPLOAD_DEST || './uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}-${file.originalname}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    await fs.writeFile(filePath, file.buffer);

    const document = this.documentsRepository.create({
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: filePath,
      uploadedById: userId,
      description,
      ...target,
    });
    const savedDoc = await this.documentsRepository.save(document);

    if (target.projectId) {
      await this.activityService.logAction(userId, 'UPLOAD_DOCUMENT', `Uploaded document "${savedDoc.originalName}"`, target.projectId);
    }

    return savedDoc;
  }

  async uploadFile(
    projectId: string,
    file: Express.Multer.File,
    description: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['assignments'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check permissions: Boss, DevOps, Superadmin, PM (manager), or assigned developer
    const canUpload =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      project.managerId === userId ||
      project.assignments.some((a) => a.developerId === userId);

    if (!canUpload) {
      throw new ForbiddenException('You do not have permission to upload documents to this project');
    }

    return this.saveFile({ projectId }, file, description, userId);
  }

  async uploadFiles(
    projectId: string,
    files: Express.Multer.File[],
    description: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const results = [];
    for (const file of files) {
      const saved = await this.uploadFile(projectId, file, description, userId, userRole);
      results.push(saved);
    }
    return results;
  }

  async uploadFileToReport(
    reportId: string,
    file: Express.Multer.File,
    description: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['createdBy'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const canUpload =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      report.createdById === userId;

    if (!canUpload) {
      throw new ForbiddenException('You do not have permission to upload files to this report');
    }

    return this.saveFile({ reportId }, file, description, userId);
  }

  async uploadFilesToReport(
    reportId: string,
    files: Express.Multer.File[],
    description: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const results = [];
    for (const file of files) {
      const saved = await this.uploadFileToReport(reportId, file, description, userId, userRole);
      results.push(saved);
    }
    return results;
  }

  async findAll(projectId: string, userId: string, userRole: UserRole, includeArchived = false) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['assignments'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access permissions
    const canAccess =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      project.managerId === userId ||
      project.assignments.some((a) => a.developerId === userId);

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.documentsRepository.find({
      where: { projectId, ...(includeArchived ? {} : { isArchived: false }) },
      order: { uploadedAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['project', 'project.assignments', 'report', 'report.createdBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check access permissions
    const canAccessProject =
      document.project &&
      ([UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
        document.project.managerId === userId ||
        document.project.assignments.some((a) => a.developerId === userId));

    const canAccessReport =
      document.report &&
      ([UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
        document.report.createdById === userId);

    if (!(canAccessProject || canAccessReport)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  async archive(id: string, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);

    // Only Boss, DevOps, Superadmin, PM (manager) for project docs, or report owner for report docs
    const canDelete =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      document.project?.managerId === userId ||
      document.report?.createdById === userId;

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to archive this document');
    }

    await this.documentsRepository.update(id, {
      isArchived: true,
      archivedAt: new Date(),
    });

    return { message: 'Document archived successfully' };
  }

  async getFileBuffer(id: string, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);
    const fileBuffer = await fs.readFile(document.path);
    return { buffer: fileBuffer, document };
  }

  async unarchive(id: string, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);

    const canRestore =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      document.project?.managerId === userId ||
      document.report?.createdById === userId;

    if (!canRestore) {
      throw new ForbiddenException('You do not have permission to unarchive this document');
    }

    await this.documentsRepository.update(id, {
      isArchived: false,
      archivedAt: null,
    });

    return { message: 'Document unarchived successfully' };
  }

  async hardDelete(id: string, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);

    const canDelete =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      document.project?.managerId === userId ||
      document.report?.createdById === userId;

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to permanently delete this document');
    }

    try {
      await fs.unlink(document.path);
    } catch (error) {
      // ignore missing file
    }

    await this.documentsRepository.delete(id);
    return { message: 'Document permanently deleted' };
  }

  async findAllForReport(reportId: string, userId: string, userRole: UserRole, includeArchived = false) {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['createdBy'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const canAccess =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN].includes(userRole) ||
      report.createdById === userId;

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return this.documentsRepository.find({
      where: { reportId, ...(includeArchived ? {} : { isArchived: false }) },
      order: { uploadedAt: 'DESC' },
    });
  }
}

