import { PartialType } from '@nestjs/swagger';
import { CreateClergyDto } from './create-clergy.dto';

export class UpdateClergyDto extends PartialType(CreateClergyDto) { }
