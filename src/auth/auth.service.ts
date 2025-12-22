import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../entities/user.entity';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async verifySuperAdminKey(superadminCreationKey: string) {
    const expectedKey = this.configService.get<string>('SUPERADMIN_CREATION_KEY');

    if (!expectedKey || superadminCreationKey !== expectedKey) {
      throw new ForbiddenException('Invalid or missing super admin creation key');
    }

    // Optionally, you could also check whether a Superadmin already exists here using usersService

    const token = this.jwtService.sign(
      { isSuperAdminCreationAuthorized: true },
      {
        expiresIn: '10m',
      },
    );

    return {
      message: 'Superadmin creation authorized.',
      token,
    };
  }

  private ensureValidSuperadminKey(key: string) {
    const expectedKey = this.configService.get<string>('SUPERADMIN_CREATION_KEY');

    if (!expectedKey || key !== expectedKey) {
      throw new ForbiddenException('Invalid or missing super admin creation key');
    }
  }

  async createSuperAdmin(dto: CreateSuperAdminDto) {
    this.ensureValidSuperadminKey(dto.superadminCreationKey);
    return this.usersService.createSuperAdmin(dto);
  }
}

