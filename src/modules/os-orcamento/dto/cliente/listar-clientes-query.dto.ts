import { PaginacaoQueryDto } from '@/infra/http/dto/paginacao-query.dto.js'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ListarClientesQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({
    description: 'Filtro de busca por nome (parcial)',
    example: 'João',
  })
  @IsOptional()
  @IsString()
  nome?: string
}