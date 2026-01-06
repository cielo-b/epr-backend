import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordDto {
    @ApiProperty({ example: 'your-reset-token' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'NewPassword123!', minLength: 6 })
    @IsString()
    @MinLength(6)
    newPassword: string;
}
