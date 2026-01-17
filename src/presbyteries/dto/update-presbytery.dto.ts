import { PartialType } from '@nestjs/swagger';
import { CreatePresbyteryDto } from './create-presbytery.dto';

export class UpdatePresbyteryDto extends PartialType(CreatePresbyteryDto) { }
