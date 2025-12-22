import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Project } from '../entities/project.entity';
import { Document } from '../entities/document.entity';
import { Report } from '@/entities/report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Document, Report])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

