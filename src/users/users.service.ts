import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from '../entities/user.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { CreateSuperAdminDto } from '../auth/dto/create-superadmin.dto';
import * as bcrypt from 'bcryptjs';

import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserPermission)
    private readonly userPermissionsRepository: Repository<UserPermission>,
    private readonly emailService: EmailService,
  ) { }

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

    // Hash password if provided
    let hashedPassword = '';
    let resetToken = null;
    let resetTokenExpires = null;

    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    } else {
      // Generate setup token
      const token = crypto.randomBytes(32).toString('hex');
      resetToken = await bcrypt.hash(token, 10);
      resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      // Set a random password hash so it's not empty but unusable
      hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

      // Sending email must happen after saving user or simply using the token
      // We'll store the UNHASHED token in memory to send it via email, 
      // but in DB we store hashed token. Usually safer to just store random string unhashed for tokens if short lived? 
      // Actually standard practice is: store hashed token in DB, send raw token to user.
      // Wait, standard reset tokens usually stored hashed? Yes for security.

      // But for simplicity/MVP, many just store the token directly.
      // Let's stick to storing the token directly for now to avoid complexity of matching. 
      // Actually, let's just store the raw token for now to be simple and reliable.
      resetToken = token;
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      createdById: createdById ?? null,
      resetToken,
      resetTokenExpires,
    });
    const savedUser = await this.usersRepository.save(user);

    // If no password provided, send invitation email
    if (!createUserDto.password && resetToken) {
      // user.resetToken has the token value
      await this.emailService.sendInvitation(savedUser.email, resetToken);
    }

    // Save permissions if provided
    if (createUserDto.permissions && createUserDto.permissions.length > 0) {
      const permissions = createUserDto.permissions.map((p) =>
        this.userPermissionsRepository.create({
          ...p,
          user: savedUser,
        }),
      );
      await this.userPermissionsRepository.save(permissions);
    }

    // Return user with permissions
    const createdUser = await this.findOne(savedUser.id);
    const { password, ...safeUser } = createdUser;
    return safeUser;
  }

  async findAll() {
    return this.usersRepository.find({
      where: { role: Not(UserRole.SUPERADMIN) },
      relations: ['createdBy', 'permissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['createdBy', 'permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['permissions']
    });
  }

  async findByResetToken(resetToken: string) {
    return this.usersRepository.findOne({
      where: { resetToken },
    });
  }

  async clearResetToken(userId: string) {
    await this.usersRepository.update(userId, {
      resetToken: null,
      resetTokenExpires: null,
    });
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

    const { permissions, ...userData } = updateUserDto;
    const updateData: Partial<User> = { ...userData };

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateData);

    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions for this user
      await this.userPermissionsRepository.delete({ userId: id });

      // Create new permissions
      if (permissions.length > 0) {
        const newPermissions = permissions.map(p =>
          this.userPermissionsRepository.create({
            ...p,
            userId: id
          })
        );
        await this.userPermissionsRepository.save(newPermissions);
      }
    }

    const updated = await this.findOne(id);
    const { password: _, ...safeUser } = updated;
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
      relations: ['permissions']
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

