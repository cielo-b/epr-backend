import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Document, ConfidentialityLevel } from '../entities/document.entity';
import { Report } from '../entities/report.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';

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
    private readonly notificationsService: NotificationsService,
  ) { }

  private async saveFile(
    target: { projectId?: string; reportId?: string; parentId?: string },
    file: Express.Multer.File,
    description: string | undefined,
    confidentiality: ConfidentialityLevel = ConfidentialityLevel.PUBLIC,
    userId: string,
  ) {
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
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
      isFolder: false,
      confidentiality,
      ...target,
    });
    const savedDoc = await this.documentsRepository.save(document);

    if (target.projectId) {
      await this.activityService.logAction(userId, 'UPLOAD_DOCUMENT', `Uploaded document "${savedDoc.originalName}" (${confidentiality})`, target.projectId);

      // Notify PM
      const project = await this.projectsRepository.findOne({ where: { id: target.projectId } });
      if (project && project.managerId && project.managerId !== userId) {
        await this.notificationsService.notifyUser(
          project.managerId,
          'New Document Uploaded',
          `Document "${savedDoc.originalName}" has been uploaded to project "${project.name}".`,
          'INFO'
        );
      }
    }

    return savedDoc;
  }

  async createFolder(
    projectId: string,
    name: string,
    parentId: string | undefined,
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

    const canCreate =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      project.managerId === userId ||
      project.assignments.some((a) => a.developerId === userId);

    if (!canCreate) {
      throw new ForbiddenException('You do not have permission to create folders in this project');
    }

    const folder = this.documentsRepository.create({
      originalName: name,
      filename: name, // Folders don't have physical files, using name as filename
      mimeType: 'application/x-directory',
      size: 0,
      path: '', // No path for folders
      projectId,
      isFolder: true,
      parentId: parentId || null,
      uploadedById: userId,
      confidentiality: ConfidentialityLevel.PUBLIC, // Folders are generally visible structure
    });

    const savedFolder = await this.documentsRepository.save(folder);
    await this.activityService.logAction(userId, 'CREATE_FOLDER', `Created folder "${name}"`, projectId);
    return savedFolder;
  }

  async uploadFile(
    projectId: string,
    file: Express.Multer.File,
    description: string | undefined,
    confidentiality: ConfidentialityLevel | undefined,
    parentId: string | undefined,
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
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      project.managerId === userId ||
      project.assignments.some((a) => a.developerId === userId);

    if (!canUpload) {
      throw new ForbiddenException('You do not have permission to upload documents to this project');
    }

    // Default to PUBLIC if not provided
    const level = confidentiality || ConfidentialityLevel.PUBLIC;

    return this.saveFile({ projectId, parentId: parentId || null }, file, description, level, userId);
  }

  async uploadFiles(
    projectId: string,
    files: Express.Multer.File[],
    description: string | undefined,
    confidentiality: ConfidentialityLevel | undefined,
    parentId: string | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const results = [];
    const level = confidentiality || ConfidentialityLevel.PUBLIC;
    for (const file of files) {
      // Re-using uploadFile would re-fetch project every time, but it's safer. 
      // Optimized: check permission once, then loop saveFile.
      // For now, let's reuse uploadFile for simplicity unless performance is key.
      const saved = await this.uploadFile(projectId, file, description, level, parentId, userId, userRole);
      results.push(saved);
    }
    return results;
  }

  async uploadFileToReport(
    reportId: string,
    file: Express.Multer.File,
    description: string | undefined,
    confidentiality: ConfidentialityLevel | undefined,
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
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      report.createdById === userId;

    if (!canUpload) {
      throw new ForbiddenException('You do not have permission to upload files to this report');
    }

    const level = confidentiality || ConfidentialityLevel.PUBLIC;
    return this.saveFile({ reportId }, file, description, level, userId);
  }

  async uploadFilesToReport(
    reportId: string,
    files: Express.Multer.File[],
    description: string | undefined,
    confidentiality: ConfidentialityLevel | undefined,
    userId: string,
    userRole: UserRole,
  ) {
    const results = [];
    const level = confidentiality || ConfidentialityLevel.PUBLIC;
    for (const file of files) {
      const saved = await this.uploadFileToReport(reportId, file, description, level, userId, userRole);
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
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      project.managerId === userId ||
      project.assignments.some((a) => a.developerId === userId) ||
      userRole === UserRole.SECRETARY ||
      userRole === 'VISITOR'; // assuming VISITOR can access if they have project permission checked by controller/guard

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const where: any = { projectId, ...(includeArchived ? {} : { isArchived: false }) };

    let documents = await this.documentsRepository.find({
      where,
      order: { uploadedAt: 'DESC' },
    });

    // Post-filtering for Confidentiality
    documents = documents.filter(doc => {
      // High privilege or Creator always sees it
      if ([UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole)) return true;
      if (doc.uploadedById === userId) return true;

      // Confidential check
      if (doc.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
        // High privilege users already returned true above.
        // So others (DEVELOPER, VISITOR) cannot see it.
        return false;
      }

      // If Public, everyone sees it.
      return true;
    });

    return documents;
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['project', 'project.assignments', 'report', 'report.createdBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // 1. Basic Access Check (Project/Report relation)
    const canAccessProject =
      document.project &&
      ([UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
        userRole === UserRole.SECRETARY ||
        document.project.managerId === userId ||
        document.project.assignments.some((a) => a.developerId === userId) || userRole === 'VISITOR');

    const canAccessReport =
      document.report &&
      ([UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
        userRole === UserRole.SECRETARY ||
        document.report.createdById === userId || userRole === 'VISITOR');

    if (!(canAccessProject || canAccessReport)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // 2. Confidentiality Check

    // High privilege or Creator allows access regardless of confidentiality
    if ([UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole)) {
      return document;
    }
    if (document.uploadedById === userId) {
      return document;
    }

    // If Confidential, reject others
    if (document.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
      // Developers and Visitors cannot see confidential
      throw new ForbiddenException('This document is confidential.');
    }

    // If Public, allow
    return document;
  }

  async archive(id: string, userId: string, userRole: UserRole) {
    const document = await this.findOne(id, userId, userRole);

    // Only Boss, DevOps, Superadmin, PM (manager) for project docs, or report owner for report docs
    const canDelete =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      document.project?.managerId === userId ||
      document.report?.createdById === userId ||
      document.uploadedById === userId;

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
    const document = await this.findOne(id, userId, userRole); // reuse findOne for checks
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(document.path);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File not found on server');
      }
      throw error;
    }

    // Audit Log: Download/View
    await this.activityService.logAction(
      userId,
      'DOWNLOAD_DOCUMENT',
      `Accessed document "${document.originalName}"`,
      document.projectId || undefined
    );

    return { buffer: fileBuffer, document };
  }

  async unarchive(id: string, userId: string, userRole: UserRole) {
    // Basic checks first
    const document = await this.documentsRepository.findOne({ where: { id }, relations: ['project', 'report'] });
    // Not using this.findOne because it might filter out archived ones depending on logic, but main issue is permissions.

    if (!document) throw new NotFoundException('Document not found');

    const canRestore =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      document.project?.managerId === userId ||
      document.report?.createdById === userId ||
      document.uploadedById === userId;

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
    // Basic checks first
    const document = await this.documentsRepository.findOne({ where: { id }, relations: ['project', 'report'] });
    if (!document) throw new NotFoundException('Document not found');

    const canDelete =
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      document.project?.managerId === userId ||
      document.report?.createdById === userId ||
      document.uploadedById === userId;

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
      [UserRole.BOSS, UserRole.DEVOPS, UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER].includes(userRole) ||
      userRole === UserRole.SECRETARY ||
      report.createdById === userId || userRole === 'VISITOR';

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this report');
    }

    const where: any = { reportId, ...(includeArchived ? {} : { isArchived: false }) };

    let documents = await this.documentsRepository.find({
      where,
      order: { uploadedAt: 'DESC' },
    });

    // Post-filtering for Confidentiality
    documents = documents.filter(doc => {
      // High privilege or Creator always sees it
      if ([UserRole.BOSS, UserRole.SUPERADMIN, UserRole.DEVOPS, UserRole.PROJECT_MANAGER].includes(userRole)) return true;
      if (doc.uploadedById === userId) return true;
      if (report.createdById === userId) return true; // Report owner sees all docs attached to report

      // Confidential check
      if (doc.confidentiality === ConfidentialityLevel.CONFIDENTIAL) {
        return false;
      }

      // If Public, everyone sees it.
      return true;
    });

    return documents;
  }
}
