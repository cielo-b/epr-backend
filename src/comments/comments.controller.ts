import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(private readonly service: CommentsService) { }

    @Post('project/:projectId')
    create(
        @Param('projectId') projectId: string,
        @Body('content') content: string,
        @Body('documentId') documentId: string,
        @CurrentUser() user: User,
    ) {
        return this.service.create(user.id, projectId, content, documentId);
    }

    @Get('project/:projectId')
    getProjectComments(@Param('projectId') projectId: string) {
        return this.service.findByProject(projectId);
    }
}
