import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'admin@epr.rw' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Super' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Key required to authorize Superadmin creation',
    example: 'my-secret-superadmin-key',
  })
  @IsString()
  @IsNotEmpty()
  superadminCreationKey: string;
}

