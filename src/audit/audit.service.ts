import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepository: Repository<AuditLog>,
    ) { }

    async log(data: {
        action: string;
        module: string;
        description: string;
        actorId: string;
        recordId?: string;
        payload?: any;
        ipAddress?: string;
    }): Promise<AuditLog> {
        const entry = this.auditRepository.create(data);
        return this.auditRepository.save(entry);
    }

    async findAll(filters?: any): Promise<AuditLog[]> {
        return this.auditRepository.find({
            where: filters,
            order: { timestamp: 'DESC' },
            relations: ['actor'],
            take: 100,
        });
    }
}
