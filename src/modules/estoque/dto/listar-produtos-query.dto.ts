import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { type QueryStatus } from '@/core/repositories/pagination-params.js'
import { type TipoProduto } from '../domain/entities/produto.js'

export class ListarProdutosQueryDto {
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
  @IsEnum(['ativos', 'deletados', 'todos'])
  status?: QueryStatus = 'ativos'

  @IsOptional()
  @IsEnum(['PECA', 'INSUMO'])
  tipo?: TipoProduto

  @IsOptional()
  @IsString()
  nome?: string
}