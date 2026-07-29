// src/infra/http/dto/ordens-servicos/obter-fila-trabalho-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, Max, Min } from 'class-validator'
import { StatusOS } from '@/generated/prisma/enums.js'
import { Type } from 'class-transformer'

export const STATUS_OS_OPCOES = [
  'RECEBIDA',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'EM_EXECUCAO',
  'AUTORIZADA',
  'PRONTA_PARA_INICIAR',
  'FINALIZADA',
  'ENTREGUE',
  'ENCERRADA_REJEICAO',
  'ENCERRADA',
] as const

export class ObterFilaTrabalhoQueryDto {
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
    example: 'RECEBIDA',
    default: 'RECEBIDA',
    enum: STATUS_OS_OPCOES,
    description: 'Filtro por estágio do ciclo de vida da Ordem de Serviço',
  })
  @IsOptional()
  @IsEnum(STATUS_OS_OPCOES, {
    message: 'O status da OS informado é inválido.',
  })
  status?: StatusOS = 'RECEBIDA'
}