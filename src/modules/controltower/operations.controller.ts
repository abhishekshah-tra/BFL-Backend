import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ControltowerService } from './controltower.service.js';
import { ControltowerQueryDto } from './dto/controltower-query.dto.js';

@ApiTags('Operations')
@Controller('operations')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
)
export class OperationsController {
  constructor(private readonly controltowerService: ControltowerService) {}

  @Get()
  @ApiOperation({
    summary: 'Get operations overview',
    description:
      'Warehouse process flow, workload, queue, and scenarios computed from warehouse master, process master, and the configuration effective on the given date.',
  })
  getOperations(@Query() query: ControltowerQueryDto) {
    return this.controltowerService.getOperations(query);
  }
}
