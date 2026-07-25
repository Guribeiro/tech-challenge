import { IsEnum, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { type StatusOS } from '@/generated/prisma/enums.js'

export class ObterFilaTrabalhoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  pagina?: number = 1

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limite?: number = 10

  @IsOptional()
  @IsEnum([
    'RECEBIDA',
    'EM_DIAGNOSTICO',
    'AGUARDANDO_APROVACAO',
    'EM_EXECUCAO',
    'AUTORIZADA',
    'PRONTA_PARA_INICIAR',
    'FINALIZADA',
    'ENTREGUE',
    'ENCERRADA_REJEICAO',
    'ENCERRADA'
  ])
  status?: StatusOS = 'RECEBIDA'
}