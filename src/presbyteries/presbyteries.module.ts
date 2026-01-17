import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresbyteriesService } from './presbyteries.service';
import { PresbyteriesController } from './presbyteries.controller';
import { Presbytery } from '../entities/presbytery.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Presbytery])],
    controllers: [PresbyteriesController],
    providers: [PresbyteriesService],
    exports: [PresbyteriesService],
})
export class PresbyteriesModule { }
