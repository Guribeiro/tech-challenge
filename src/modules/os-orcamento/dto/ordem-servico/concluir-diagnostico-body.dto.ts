// src/infra/http/dto/ordem-servico/concluir-diagnostico-body.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ComponenteItemDto } from './componente-item.dto.js'
import { ServicoItemDto } from './servico-item.dto.js'

export class ConcluirDiagnosticoBodyDto {
  @ApiPropertyOptional({
    type: [ServicoItemDto],
    description: 'Lista de serviços apurados durante o diagnóstico',
  })
  @IsOptional()
  @IsArray({ message: 'Serviços deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ServicoItemDto)
  servicos?: ServicoItemDto[]

  @ApiPropertyOptional({
    type: [ComponenteItemDto],
    description: 'Lista de componentes/peças identificados no diagnóstico',
  })
  @IsOptional()
  @IsArray({ message: 'Componentes deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ComponenteItemDto)
  componentes?: ComponenteItemDto[]
}