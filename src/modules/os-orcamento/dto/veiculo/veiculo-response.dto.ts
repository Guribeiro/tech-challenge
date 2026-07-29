// src/infra/http/dto/veiculo-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class VeiculoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string

  @ApiProperty({ example: '987f6543-e21b-34c5-d678-987654321000' })
  clienteId!: string

  @ApiProperty({ example: 'ABC1D23' })
  placa!: string

  @ApiProperty({ example: 'Toyota' })
  marca!: string

  @ApiProperty({ example: 'Corolla' })
  modelo!: string

  @ApiProperty({ example: 2022 })
  ano!: number

  @ApiPropertyOptional({ example: 'Preto', nullable: true })
  cor?: string | null

  @ApiPropertyOptional({ example: 45000, nullable: true })
  quilometragem?: number | null

  @ApiPropertyOptional({ example: 'Flex', nullable: true })
  combustivel?: string | null

  @ApiPropertyOptional({ example: 'Arranhão no para-choque traseiro', nullable: true })
  observacoes?: string | null

  @ApiProperty({ example: '2026-03-30T14:00:00.000Z' })
  criadoEm!: Date

  @ApiPropertyOptional({ example: '2026-03-30T15:30:00.000Z', nullable: true })
  atualizadoEm?: Date | null

  @ApiPropertyOptional({ example: '2026-03-30T15:30:00.000Z', nullable: true })
  deletadoEm?: Date | null
}