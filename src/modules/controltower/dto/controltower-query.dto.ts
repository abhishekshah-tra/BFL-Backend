import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

import { ControlTowerTimeframe } from '../controltower.types.js';

export { ControlTowerTimeframe };

export class ControltowerQueryDto {
  @ApiPropertyOptional({
    enum: ControlTowerTimeframe,
    example: ControlTowerTimeframe.TODAY,
    description:
      'Return a single timeframe slice. Omit to return today, yesterday, and last7 together.',
  })
  @IsOptional()
  @IsEnum(ControlTowerTimeframe)
  timeframe?: ControlTowerTimeframe;

  @ApiPropertyOptional({
    example: '2026-09-21',
    description:
      'As-of business date used to pick the warehouse configuration effective on that day.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be YYYY-MM-DD',
  })
  date?: string;
}
