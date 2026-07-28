import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

import { ComponenteItemDto } from './componente-item.dto.js'
import { ServicoItemDto } from './servico-item.dto.js'


export class RenegocicarOrcamentoBodyDto {
  @IsNumber({}, { message: 'A quantidade deve ser um número.' })
  descontoPorcentagem!: number

  @IsOptional()
  @IsArray({ message: 'Serviços deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ServicoItemDto)
  servicos?: ServicoItemDto[]

  @IsOptional()
  @IsArray({ message: 'Componentes deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ComponenteItemDto)
  componentes?: ComponenteItemDto[]
}