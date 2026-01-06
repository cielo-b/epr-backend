import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
    constructor(
        @InjectRepository(Server)
        private serversRepository: Repository<Server>,
    ) { }

    create(createServerDto: CreateServerDto) {
        const server = this.serversRepository.create(createServerDto);
        return this.serversRepository.save(server);
    }

    findAll() {
        return this.serversRepository.find();
    }

    async findOne(id: string) {
        const server = await this.serversRepository.findOneBy({ id });
        if (!server) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }
        return server;
    }

    async update(id: string, updateServerDto: UpdateServerDto) {
        const server = await this.findOne(id);
        Object.assign(server, updateServerDto);
        return this.serversRepository.save(server);
    }

    async remove(id: string) {
        const result = await this.serversRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }
        return { deleted: true };
    }
}
