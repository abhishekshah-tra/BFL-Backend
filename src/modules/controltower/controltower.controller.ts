import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ControltowerService } from './controltower.service.js';
import { ControltowerQueryDto } from './dto/controltower-query.dto.js';

@ApiTags('Control Tower')
@Controller('control-tower')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
)
export class ControltowerController {
  constructor(private readonly controltowerService: ControltowerService) {}

  @Get()
  @ApiOperation({
    summary: 'Get control tower dashboard data',
    description:
      'Computes today, yesterday, and last7 from warehouse master, process master, and warehouse configuration. Pass timeframe for a single slice, or date to select the configuration effective on that day.',
  })
  getDashboard(@Query() query: ControltowerQueryDto) {
    return this.controltowerService.getDashboard(query);
  }

  @Get('dates')
  @ApiOperation({
    summary: 'List the last 7 business dates for the control tower date picker',
  })
  listDates() {
    return this.controltowerService.listDates();
  }
}
