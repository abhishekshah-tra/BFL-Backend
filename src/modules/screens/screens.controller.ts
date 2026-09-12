import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ScreensService } from './screens.service.js';
import { CreateScreenDto } from './dto/create-screen.dto.js';
import { UpdateScreenDto } from './dto/update-screen.dto.js';

@Controller('screens')
export class ScreensController {
  constructor(
    private readonly screensService: ScreensService,
  ) {}

  @Post()
  create(@Body() dto: CreateScreenDto) {
    return this.screensService.create(dto);
  }

  @Get()
  findAll() {
    return this.screensService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.screensService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScreenDto,
  ) {
    return this.screensService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.screensService.remove(id);
  }
}