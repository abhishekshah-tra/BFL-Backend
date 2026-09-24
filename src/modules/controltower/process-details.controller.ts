import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ControltowerService } from './controltower.service.js';
import { ControltowerQueryDto } from './dto/controltower-query.dto.js';

@ApiTags('Process Details')
@Controller('process-details')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
)
export class ProcessDetailsController {
  constructor(private readonly controltowerService: ControltowerService) {}

  @Get()
  @ApiOperation({
    summary: 'Get process and resource details',
    description:
      'Per-warehouse process status, resource breakdown, queue trend, and actions computed from warehouse master, process master, and configuration.',
  })
  getProcessDetails(@Query() query: ControltowerQueryDto) {
    return this.controltowerService.getProcessDetails(query);
  }
}
