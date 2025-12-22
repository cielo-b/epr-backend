import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload/:projectId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload document to project' })
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.documentsService.uploadFile(projectId, file, description, user.id, user.role);
  }

  @Post('upload-many/:projectId')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload multiple documents to project' })
  async uploadFiles(
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }
    return this.documentsService.uploadFiles(projectId, files, description, user.id, user.role);
  }

  @Post('upload-report/:reportId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload document to report' })
  async uploadFileToReport(
    @Param('reportId') reportId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.documentsService.uploadFileToReport(reportId, file, description, user.id, user.role);
  }

  @Post('upload-many-report/:reportId')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload multiple documents to report' })
  async uploadFilesToReport(
    @Param('reportId') reportId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }
    return this.documentsService.uploadFilesToReport(reportId, files, description, user.id, user.role);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all documents for a project' })
  findAll(
    @Param('projectId') projectId: string,
    @Query('includeArchived') includeArchived: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.findAll(projectId, user.id, user.role, includeArchived === 'true');
  }

  @Get('report/:reportId')
  @ApiOperation({ summary: 'Get all documents for a report' })
  findAllForReport(
    @Param('reportId') reportId: string,
    @Query('includeArchived') includeArchived: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.findAllForReport(reportId, user.id, user.role, includeArchived === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document metadata' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.findOne(id, user.id, user.role);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  async download(@Param('id') id: string, @Res() res: Response, @CurrentUser() user: any) {
    const { buffer, document } = await this.documentsService.getFileBuffer(id, user.id, user.role);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.send(buffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive document (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.archive(id, user.id, user.role);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive document' })
  unarchive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.unarchive(id, user.id, user.role);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete document' })
  hardDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.hardDelete(id, user.id, user.role);
  }
}

