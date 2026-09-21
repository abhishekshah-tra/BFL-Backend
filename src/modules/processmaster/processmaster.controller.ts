import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProcessmasterService } from './processmaster.service.js';
import { CreateProcessmasterDto } from './dto/create-processmaster.dto.js';
import { UpdateProcessmasterDto } from './dto/update-processmaster.dto.js';

@Controller('processmaster')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
)
export class ProcessmasterController {
  constructor(private readonly processmasterService: ProcessmasterService) {}

  @Post()
  create(@Body() createProcessmasterDto: CreateProcessmasterDto) {
    return this.processmasterService.create(createProcessmasterDto);
  }

  @Get()
  findAll() {
    return this.processmasterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.processmasterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProcessmasterDto: UpdateProcessmasterDto) {
    return this.processmasterService.update(id, updateProcessmasterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.processmasterService.remove(id);
  }
}
