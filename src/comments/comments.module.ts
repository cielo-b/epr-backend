import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

import { NotificationsModule } from '../notifications/notifications.module';
import { Project } from '../entities/project.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Comment, Project]),
        NotificationsModule,
    ],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule { }
