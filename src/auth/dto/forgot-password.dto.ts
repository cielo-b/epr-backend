import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@epr.rw' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
