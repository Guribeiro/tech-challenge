import { PaginacaoQueryDto } from '@/infra/http/dto/paginacao-query.dto.js'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

export class ListarClientesQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({
    description: 'Filtro de busca por nome (parcial)',
    example: 'João',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value
    return value.replace(/\0/g, '').trim()
  })
  nome?: string
}