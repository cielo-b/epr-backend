import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from '../entities/user.entity';
import { CreateSuperAdminDto } from '../auth/dto/create-superadmin.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, createdById?: string | null) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Prevent creating more than one Superadmin
    if (createUserDto.role === UserRole.SUPERADMIN) {
      const existingSuperadmin = await this.usersRepository.findOne({ where: { role: UserRole.SUPERADMIN } });
      if (existingSuperadmin) {
        throw new ConflictException('A Superadmin already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      createdById: createdById ?? null,
    });
    await this.usersRepository.save(user);

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findAll() {
    return this.usersRepository.find({
      where: { role: Not(UserRole.SUPERADMIN) },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    // Prevent creating another Superadmin via update
    if (updateUserDto.role === UserRole.SUPERADMIN) {
      const existingSuperadmin = await this.usersRepository.findOne({
        where: { role: UserRole.SUPERADMIN, id: Not(id) },
      });
      if (existingSuperadmin) {
        throw new ConflictException('A Superadmin already exists');
      }
    }

    const updateData: Partial<User> = { ...updateUserDto };

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateData);
    const updated = await this.findOne(id);
    const { password, ...safeUser } = updated;
    return safeUser;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.usersRepository.delete(id);
    return { message: 'User deleted successfully' };
  }

  async getUsersByRole(role: UserRole) {
    return this.usersRepository.find({
      where: { role, isActive: true },
    });
  }

  async createSuperAdmin(dto: CreateSuperAdminDto) {
    const existingSuperAdmin = await this.usersRepository.findOne({
      where: { role: UserRole.SUPERADMIN },
    });

    if (existingSuperAdmin) {
      throw new ConflictException('A Superadmin already exists');
    }

    const createUserDto: CreateUserDto = {
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.SUPERADMIN,
      isActive: true,
    };

    return this.create(createUserDto, null);
  }
}

