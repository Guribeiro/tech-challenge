import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { type TipoProduto } from '../domain/entities/produto.js'
import { PaginacaoQueryDto } from '@/infra/http/dto/paginacao-query.dto.js'
import { Transform } from 'class-transformer'

const TIPOS_PRODUTO = ['PECA', 'INSUMO'] as const

export class ListarProdutosQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({
    example: 'PECA',
    enum: TIPOS_PRODUTO,
    description: 'Filtro por tipo de produto (PECA ou INSUMO)',
  })
  @IsOptional()
  @IsEnum(TIPOS_PRODUTO, {
    message: 'O tipo deve ser PECA ou INSUMO.',
  })
  tipo?: TipoProduto

  @ApiPropertyOptional({
    example: 'Filtro de Óleo',
    description: 'Filtro por nome ou termo de busca do produto',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value
    return value.replaceAll(/\0/g, '').trim()
  })
  nome?: string
}