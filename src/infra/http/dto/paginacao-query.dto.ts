import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { type QueryStatus } from '@/core/repositories/pagination-params.js'

export const OPCOES_STATUS = ['ativos', 'deletados', 'todos'] as const

export class PaginacaoQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Número da página desejada para paginação',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  pagina?: number = 1

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    description: 'Quantidade de registros por página (máximo 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limite?: number = 10

  @ApiPropertyOptional({
    example: 'ativos',
    default: 'ativos',
    enum: OPCOES_STATUS,
    description: 'Filtro por status de atividade dos registros',
  })
  @IsOptional()
  @IsEnum(OPCOES_STATUS, {
    message: 'O status deve ser ativos, deletados ou todos.',
  })
  status?: QueryStatus = 'ativos'
}