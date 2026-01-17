import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomRole } from '../entities/custom-role.entity';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(CustomRole)
        private rolesRepository: Repository<CustomRole>,
    ) { }

    async findAll() {
        return this.rolesRepository.find({
            relations: ['users'],
        });
    }

    async findOne(id: string) {
        const role = await this.rolesRepository.findOne({
            where: { id },
            relations: ['users'],
        });
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async create(data: Partial<CustomRole>) {
        const role = this.rolesRepository.create(data);
        return this.rolesRepository.save(role);
    }

    async update(id: string, data: Partial<CustomRole>) {
        await this.findOne(id);
        await this.rolesRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: string) {
        const role = await this.findOne(id);
        return this.rolesRepository.remove(role);
    }
}
