// src/infra/http/dto/mecanico-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RecepcionistaResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string

  @ApiProperty({ example: 'Carlos Silva' })
  nome!: string

  @ApiProperty({ example: 'carlos.recepcionista@email.com' })
  email!: string

  @ApiProperty({ example: '2026-03-30T14:00:00.000Z' })
  criadoEm!: Date

  @ApiPropertyOptional({ example: '2026-03-30T14:00:00.000Z', nullable: true })
  atualizadoEm?: Date | null

  @ApiPropertyOptional({ example: null, nullable: true })
  desativadoEm?: Date | null
}

export class CriarRecepcionistaResponseDto {
  @ApiProperty({ type: RecepcionistaResponseDto })
  recepcionista!: RecepcionistaResponseDto
}