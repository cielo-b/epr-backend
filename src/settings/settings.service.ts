import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private readonly settingRepository: Repository<Setting>,
    ) { }

    async findAll(): Promise<Setting[]> {
        return this.settingRepository.find();
    }

    async findByKey(key: string): Promise<Setting> {
        const setting = await this.settingRepository.findOne({ where: { key } });
        if (!setting) {
            throw new NotFoundException(`Setting with key ${key} not found`);
        }
        return setting;
    }

    async getByGroup(group: string): Promise<Setting[]> {
        return this.settingRepository.find({ where: { group } });
    }

    async update(key: string, value: string): Promise<Setting> {
        let setting = await this.settingRepository.findOne({ where: { key } });
        if (!setting) {
            setting = this.settingRepository.create({ key, value });
        } else {
            setting.value = value;
        }
        return this.settingRepository.save(setting);
    }

    async updateBulk(settings: Record<string, any>): Promise<void> {
        for (const [key, value] of Object.entries(settings)) {
            await this.update(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
    }

    async initializeDefaults(): Promise<void> {
        const defaults = [
            { key: 'CHURCH_NAME', value: 'Eglise Presbyterienne au Rwanda', group: 'CHURCH_INFO', type: 'string' },
            { key: 'CHURCH_ADDRESS', value: 'Kigali, Rwanda', group: 'CHURCH_INFO', type: 'string' },
            { key: 'CHURCH_EMAIL', value: 'info@epr.org.rw', group: 'CHURCH_INFO', type: 'string' },
            { key: 'CHURCH_PHONE', value: '+250 123 456 789', group: 'CHURCH_INFO', type: 'string' },
            { key: 'FINANCIAL_YEAR_START', value: '1', group: 'FINANCIAL', type: 'number' },
            { key: 'CURRENCY', value: 'RWF', group: 'FINANCIAL', type: 'string' },
        ];

        for (const def of defaults) {
            const existing = await this.settingRepository.findOne({ where: { key: def.key } });
            if (!existing) {
                await this.settingRepository.save(this.settingRepository.create(def as any));
            }
        }
    }
}
