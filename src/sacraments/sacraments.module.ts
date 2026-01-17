import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SacramentsService } from './sacraments.service';
import { SacramentsController } from './sacraments.controller';
import { Sacrament } from '../entities/sacrament.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Sacrament])],
    controllers: [SacramentsController],
    providers: [SacramentsService],
    exports: [SacramentsService],
})
export class SacramentsModule { }
