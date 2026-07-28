import { ApiProperty } from '@nestjs/swagger'

export class MetaPaginacaoResponseDto {
  @ApiProperty({ description: 'Total geral de registros encontrados', example: 42 })
  total!: number

  @ApiProperty({ description: 'Página atual', example: 1 })
  pagina!: number

  @ApiProperty({ description: 'Limite de registros por página', example: 10 })
  limite!: number

  @ApiProperty({ description: 'Total de páginas calculadas', example: 5 })
  totalPaginas!: number
}