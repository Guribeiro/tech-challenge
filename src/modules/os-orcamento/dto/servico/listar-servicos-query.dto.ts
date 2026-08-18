import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { PaginacaoQueryDto } from '@/infra/http/dto/paginacao-query.dto.js'
import { Transform } from 'class-transformer'

export class ListarServicosQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({
    example: 'Troca de óleo',
    description: 'Filtro por nome ou termo de busca do serviço',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value
    return value.replace(/\0/g, '').trim()
  })
  nome?: string
}