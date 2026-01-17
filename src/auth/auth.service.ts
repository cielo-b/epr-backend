import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as nodeCrypto from 'crypto';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) { }

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

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If this email exists, a password reset link has been sent.' };
    }

    const token = nodeCrypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.usersService.saveResetToken(user.id, token, expires);
    await this.emailService.sendPasswordResetEmail(user.email, token, user.firstName);

    return { message: 'If this email exists, a password reset link has been sent.' };
  }

  async setPassword(token: string, newPassword: string) {
    let user = await this.usersService.findByResetToken(token);

    // In production we would assume token is hashed in DB, so we would compare bcrypt.compare(token, user.resetToken)
    // checking all users? No, usually you lookup by resetToken column directly if it's unique.
    // If we store hashed token, we can't lookup by it. We would need to pass email + token.
    // But since we implemented storing RAW token in `resetToken` column in UsersService (Step 2202), direct lookup is fine.

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    await this.usersService.update(user.id, {
      password: newPassword, // UpdateUserDto handles hashing?? No, usually service does.
      // Wait, UsersService.update handles hashing if password provided? 
      // Let's check UsersService.update again. Yes (Step 2142, line 110).
    } as any);

    // We need to clear the token, but UsersService.update might not allow ad-hoc column updates unless we cast or modify DTO.
    // Let's modify UsersService.update or just do it via repository here if we had access? 
    // We don't have access to repo here. 
    // We can just rely on UsersService.usersRepository which is private.
    // Better way: UsersService should have a specific method or modify Update logic.
    // Actually, let's create a clearResetToken method in UsersService or just manually update if we can access repo (we can't).

    // Simpler: Just re-fetch and save via repository? No access.
    // We must rely on `UsersService.update`. 
    // But `UpdateUserDto` doesn't have `resetToken`.
    // Let's add `resetToken` to `UpdateUserDto` or create a specific method `updatePasswordAndClearToken` in UsersService.

    // For now, let's just update the password. The token will remain but we can expire it.
    // Actually, reusing a token is bad.

    // Let's add `clearResetToken` to `UsersService` to be clean.
    await this.usersService.clearResetToken(user.id);

    return { message: 'Password set successfully' };
  }
}

