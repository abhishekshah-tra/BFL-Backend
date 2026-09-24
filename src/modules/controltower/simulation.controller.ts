import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ControltowerService } from './controltower.service.js';
import { ControltowerQueryDto } from './dto/controltower-query.dto.js';

@ApiTags('Simulation')
@Controller('simulation')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
)
export class SimulationController {
  constructor(private readonly controltowerService: ControltowerService) {}

  @Get()
  @ApiOperation({
    summary: 'Get simulation and scenario inputs',
    description:
      'Per-warehouse process capacity, staffing, and what-if plans computed from warehouse master, process master, and configuration. The browser replays the 30-minute day from this model.',
  })
  getSimulation(@Query() query: ControltowerQueryDto) {
    return this.controltowerService.getSimulation(query);
  }
}
