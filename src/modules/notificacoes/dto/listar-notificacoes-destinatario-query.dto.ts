import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

const OPCOES_STATUS = ['lidas', 'nao_lidas', 'todos'] as const

export class ListarNotificacoesDestinatarioQueryDto {
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
    description: 'Quantidade de registros por página',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limite?: number = 10

  @ApiPropertyOptional({
    example: 'nao_lidas',
    enum: OPCOES_STATUS,
    default: 'nao_lidas',
    description: 'Filtro por notificações lidas, não lidas ou todos',
  })
  @IsOptional()
  @IsEnum(OPCOES_STATUS, {
    message: 'O status deve ser lidas, nao_lidas ou todos.',
  })
  status?: (typeof OPCOES_STATUS)[number] = 'nao_lidas'
}
