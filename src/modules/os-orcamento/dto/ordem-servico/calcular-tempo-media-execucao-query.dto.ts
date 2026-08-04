import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class CalcularTempoMedioQueryDto {
  @ApiPropertyOptional({
    description: 'Data inicial para o filtro de finalização (Formato ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
    type: String,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @ApiPropertyOptional({
    description: 'Data final para o filtro de finalização (Formato ISO 8601)',
    example: '2026-01-31T23:59:59.999Z',
    type: String,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;
}