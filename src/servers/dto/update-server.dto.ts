import { PartialType } from '@nestjs/swagger';
import { CreateServerDto } from './create-server.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ServerStatus } from '../../entities/server.entity';

export class UpdateServerDto extends PartialType(CreateServerDto) {
    @ApiPropertyOptional({ enum: ServerStatus })
    @IsOptional()
    @IsEnum(ServerStatus)
    status?: ServerStatus;
}
