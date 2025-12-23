import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private repo: Repository<Comment>,
    ) { }

    async create(authorId: string, projectId: string, content: string, documentId?: string) {
        const comment = this.repo.create({
            authorId,
            projectId,
            content,
            documentId: documentId || null,
        });
        return this.repo.save(comment);
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
