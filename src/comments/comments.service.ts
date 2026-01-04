import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Project } from '../entities/project.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private repo: Repository<Comment>,
        @InjectRepository(Project)
        private projectRepo: Repository<Project>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(authorId: string, projectId: string, content: string, documentId?: string) {
        const comment = this.repo.create({
            authorId,
            projectId,
            content,
            documentId: documentId || null,
        });
        const saved = await this.repo.save(comment);

        // Notify project manager and team about new comment
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
            relations: ['manager', 'assignments', 'assignments.developer', 'creator'],
        });

        if (project) {
            const usersToNotify = new Set<string>();

            // Add manager
            if (project.managerId && project.managerId !== authorId) {
                usersToNotify.add(project.managerId);
            }

            // Add creator if different
            if (project.creatorId && project.creatorId !== authorId) {
                usersToNotify.add(project.creatorId);
            }

            // Add assigned developers
            project.assignments?.forEach(assignment => {
                if (assignment.developerId && assignment.developerId !== authorId) {
                    usersToNotify.add(assignment.developerId);
                }
            });

            // Send notifications
            for (const userId of usersToNotify) {
                await this.notificationsService.notifyUser(
                    userId,
                    `New Comment on ${project.name}`,
                    `A new comment has been added to the project.\n\nComment: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
                    'INFO'
                );
            }
        }

        return saved;
    }

    async findByProject(projectId: string) {
        return this.repo.find({
            where: { projectId },
            order: { createdAt: 'ASC' },
            relations: ['author'],
        });
    }

    async delete(id: string) {
        const comment = await this.repo.findOne({ where: { id } });
        if (!comment) return null;
        return this.repo.remove(comment);
    }
}
