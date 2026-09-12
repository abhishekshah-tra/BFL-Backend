import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateActionDto } from './dto/create-action.dto.js';
import { UpdateActionDto } from './dto/update-action.dto.js';
import { ActionsService } from './action.service.js';

@Controller('actions')
export class ActionsController {
  constructor(
    private readonly actionsService: ActionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateActionDto) {
    return this.actionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.actionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActionDto,
  ) {
    return this.actionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actionsService.remove(id);
  }
}