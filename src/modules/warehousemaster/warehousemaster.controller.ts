import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WarehousemasterService } from './warehousemaster.service.js';
import { CreateWarehousemasterDto } from './dto/create-warehousemaster.dto.js';
import { UpdateWarehousemasterDto } from './dto/update-warehousemaster.dto.js';

@Controller('warehousemaster')
export class WarehousemasterController {
  constructor(private readonly warehousemasterService: WarehousemasterService) {}

  @Post()
  create(@Body() createWarehousemasterDto: CreateWarehousemasterDto) {
    return this.warehousemasterService.create(createWarehousemasterDto);
  }

  @Get()
  findAll() {
    return this.warehousemasterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehousemasterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehousemasterDto: UpdateWarehousemasterDto) {
    return this.warehousemasterService.update(id, updateWarehousemasterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehousemasterService.remove(id);
  }
}
