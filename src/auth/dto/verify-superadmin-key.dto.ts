import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifySuperAdminKeyDto {
  @ApiProperty({
    description: 'One-time key required to authorize Superadmin creation',
    example: 'my-secret-superadmin-key',
  })
  @IsString()
  @IsNotEmpty()
  superadminCreationKey: string;
}




