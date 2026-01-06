import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user.entity';
import { CreatePermissionDto } from './create-permission.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@rmsoft.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6, required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DEVELOPER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [CreatePermissionDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  permissions?: CreatePermissionDto[];
}

