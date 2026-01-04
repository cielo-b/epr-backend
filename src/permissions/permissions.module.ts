import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPermission } from '../entities/user-permission.entity';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';

@Module({
    imports: [TypeOrmModule.forFeature([UserPermission])],
    controllers: [PermissionsController],
    providers: [PermissionsService],
    exports: [PermissionsService],
})
export class PermissionsModule { }
