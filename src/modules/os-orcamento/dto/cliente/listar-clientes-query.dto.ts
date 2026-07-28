import type { QueryStatus } from '@/core/repositories/pagination-params.js'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'

export enum QueryStatusEnum {
  ATIVOS = 'ativos',
  DELETADOS = 'deletados',
  TODOS = 'todos',
}

export class ListarClientesQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  pagina?: number = 1

  @ApiPropertyOptional({
    description: 'Quantidade de registros por página',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limite?: number = 10

  @ApiPropertyOptional({
    description: 'Filtro por status do cliente',
    enum: QueryStatusEnum, // Define o enum para o Swagger criar o Select Box no UI
    default: QueryStatusEnum.ATIVOS,
    example: QueryStatusEnum.ATIVOS,
  })
  @IsOptional()
  @IsEnum(['ativos', 'deletados', 'todos'])
  status?: QueryStatus = 'ativos'

  @ApiPropertyOptional({
    description: 'Filtro de busca por nome (parcial)',
    example: 'João',
  })
  @IsOptional()
  @IsString()
  nome?: string
}