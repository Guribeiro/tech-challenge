import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { type QueryStatus } from '@/core/repositories/pagination-params.js'

export class ListarServicosQueryDto {
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
  @IsString()
  nome?: string
}