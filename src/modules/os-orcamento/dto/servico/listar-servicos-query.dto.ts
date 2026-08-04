import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { PaginacaoQueryDto } from '@/infra/http/dto/paginacao-query.dto.js'

export class ListarServicosQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({
    example: 'Troca de óleo',
    description: 'Filtro por nome ou termo de busca do serviço',
  })
  @IsOptional()
  @IsString()
  nome?: string
}