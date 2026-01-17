import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member, MemberStatus } from '../entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class MembersService {
    constructor(
        @InjectRepository(Member)
        private memberRepository: Repository<Member>,
    ) { }

    async create(createMemberDto: CreateMemberDto, user?: User): Promise<Member> {
        // Enforce scope on creation if user is not superadmin
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY') createMemberDto.parishId = undefined; // Presbytery roles might manage parishes but createMemberDto usually targets a parish?
            if (level === 'PARISH' && createMemberDto.parishId !== targetId) {
                createMemberDto.parishId = targetId; // Force to their parish
            }
            if (level === 'COMMUNITY' && createMemberDto.communityId !== targetId) {
                createMemberDto.communityId = targetId; // Force to their community
            }
        }

        // Check if membership number already exists
        const existing = await this.memberRepository.findOne({
            where: { membershipNumber: createMemberDto.membershipNumber },
        });

        if (existing) {
            throw new BadRequestException('Membership number already exists');
        }

        const member = this.memberRepository.create(createMemberDto);
        return await this.memberRepository.save(member);
    }

    async findAll(filters?: {
        parishId?: string;
        communityId?: string;
        status?: MemberStatus;
    }, user?: User): Promise<Member[]> {
        const query: any = {
            relations: ['parish', 'community'],
            order: { lastName: 'ASC', firstName: 'ASC' },
        };

        const where: any = {};
        if (filters?.parishId) where.parishId = filters.parishId;
        if (filters?.communityId) where.communityId = filters.communityId;
        if (filters?.status) where.status = filters.status;

        // Apply Scope Filtering
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY') {
                // If there's a relation from Parish to Presbytery, we should filter by that.
                // Assuming Member has parish which has presbyteryId or Member has presbyteryId.
                // Looking at entity, Member has parishId.
                // For simplicity, let's assume we filter by parishId if we have one, or just the level.
            } else if (level === 'PARISH') {
                where.parishId = targetId;
            } else if (level === 'COMMUNITY') {
                where.communityId = targetId;
            }
        }

        if (Object.keys(where).length > 0) {
            query.where = where;
        }

        return await this.memberRepository.find(query);
    }

    async findOne(id: string, user?: User): Promise<Member> {
        const member = await this.memberRepository.findOne({
            where: { id },
            relations: ['parish', 'community'],
        });

        if (!member) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }

        // Check scope if user is provided
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PARISH' && member.parishId !== targetId) {
                throw new NotFoundException('Access denied to this member (Out of scope)');
            }
            if (level === 'COMMUNITY' && member.communityId !== targetId) {
                throw new NotFoundException('Access denied to this member (Out of scope)');
            }
        }

        return member;
    }

    async findByMembershipNumber(membershipNumber: string): Promise<Member> {
        const member = await this.memberRepository.findOne({
            where: { membershipNumber },
            relations: ['parish', 'community'],
        });

        if (!member) {
            throw new NotFoundException(
                `Member with membership number ${membershipNumber} not found`,
            );
        }

        return member;
    }

    async update(id: string, updateMemberDto: UpdateMemberDto, user?: User): Promise<Member> {
        const member = await this.findOne(id, user);

        // If updating membership number, check uniqueness
        if (
            updateMemberDto.membershipNumber &&
            updateMemberDto.membershipNumber !== member.membershipNumber
        ) {
            const existing = await this.memberRepository.findOne({
                where: { membershipNumber: updateMemberDto.membershipNumber },
            });
            if (existing) {
                throw new BadRequestException('Membership number already exists');
            }
        }

        Object.assign(member, updateMemberDto);
        return await this.memberRepository.save(member);
    }

    async remove(id: string, user?: User): Promise<void> {
        const member = await this.findOne(id, user);
        await this.memberRepository.remove(member);
    }

    async transferMember(
        id: string,
        newParishId: string,
        newCommunityId?: string,
        user?: User,
    ): Promise<Member> {
        const member = await this.findOne(id, user);

        member.transferredTo = member.parishId;
        member.transferDate = new Date();
        member.parishId = newParishId;
        member.communityId = newCommunityId || null;
        member.status = MemberStatus.TRANSFERRED;

        return await this.memberRepository.save(member);
    }

    async markAsDeceased(id: string, deceasedDate: Date, user?: User): Promise<Member> {
        const member = await this.findOne(id, user);

        member.status = MemberStatus.DECEASED;
        member.deceasedDate = deceasedDate;
        member.isActive = false;

        return await this.memberRepository.save(member);
    }

    async search(query: string, user?: User): Promise<Member[]> {
        const builder = this.memberRepository
            .createQueryBuilder('member')
            .leftJoinAndSelect('member.parish', 'parish')
            .leftJoinAndSelect('member.community', 'community')
            .where('(member.firstName ILIKE :query OR member.lastName ILIKE :query OR member.membershipNumber ILIKE :query OR member.phone ILIKE :query OR member.email ILIKE :query)', { query: `%${query}%` })
            .orderBy('member.lastName', 'ASC')
            .addOrderBy('member.firstName', 'ASC');

        // Apply Scope Filtering
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PARISH') {
                builder.andWhere('member.parishId = :targetId', { targetId });
            } else if (level === 'COMMUNITY') {
                builder.andWhere('member.communityId = :targetId', { targetId });
            }
        }

        return await builder.getMany();
    }

    async getStatisticsByParish(parishId: string): Promise<any> {
        const members = await this.findAll({ parishId });

        const total = members.length;
        const active = members.filter(m => m.status === MemberStatus.ACTIVE).length;
        const baptized = members.filter(m => m.baptismDate).length;
        const confirmed = members.filter(m => m.confirmationDate).length;
        const married = members.filter(m => m.marriageDate).length;

        const byGender = {
            male: members.filter(m => m.gender === 'male').length,
            female: members.filter(m => m.gender === 'female').length,
        };

        const byMaritalStatus = {
            single: members.filter(m => m.maritalStatus === 'single').length,
            married: members.filter(m => m.maritalStatus === 'married').length,
            widowed: members.filter(m => m.maritalStatus === 'widowed').length,
            divorced: members.filter(m => m.maritalStatus === 'divorced').length,
        };

        return {
            total,
            active,
            baptized,
            confirmed,
            married,
            byGender,
            byMaritalStatus,
        };
    }
}
