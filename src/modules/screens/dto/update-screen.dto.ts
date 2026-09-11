import { PartialType } from '@nestjs/swagger';
import { CreateScreenDto } from './create-screen.dto.js';

export class UpdateScreenDto extends PartialType(CreateScreenDto) {}
