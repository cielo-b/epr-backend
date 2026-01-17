import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { VerifySuperAdminKeyDto } from './dto/verify-superadmin-key.dto';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import { SetPasswordDto } from './dto/set-password.dto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists.' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('verify-superadmin-key')
  @ApiOperation({ summary: 'Verify key required to create a Superadmin user' })
  @ApiResponse({ status: 201, description: 'Key is valid; Superadmin creation authorized.' })
  @ApiResponse({ status: 403, description: 'Invalid or missing super admin creation key.' })
  async verifySuperAdminKey(@Body() body: VerifySuperAdminKeyDto) {
    return this.authService.verifySuperAdminKey(body.superadminCreationKey);
  }

  @Public()
  @Post('create-superadmin')
  @ApiOperation({ summary: 'Create the first Superadmin (requires SUPERADMIN_CREATION_KEY)' })
  @ApiResponse({ status: 201, description: 'Superadmin created successfully.' })
  @ApiResponse({ status: 403, description: 'Invalid or missing super admin creation key.' })
  @ApiResponse({ status: 409, description: 'A Superadmin already exists.' })
  async createSuperAdmin(@Body() body: CreateSuperAdminDto) {
    return this.authService.createSuperAdmin(body);
  }

  @Public()
  @Post('set-password')
  @ApiOperation({ summary: 'Set password using invitation/reset token' })
  @ApiResponse({ status: 201, description: 'Password set successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  async setPassword(@Body() body: SetPasswordDto) {
    return this.authService.setPassword(body.token, body.newPassword);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}

