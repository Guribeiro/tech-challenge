// src/infra/http/dto/servico-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'

export class ServicoResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único do serviço (UUID)',
  })
  id!: string

  @ApiProperty({
    example: 'Troca de Óleo e Filtro',
    description: 'Nome do serviço prestado',
  })
  nome!: string

  @ApiProperty({
    example: 'MANUTENCAO_PREVENTIVA',
    enum: [
      'SEGURANCA',
      'MANUTENCAO_PREVENTIVA',
      'ESTETICA',
      'ELETRICA',
      'MECANICA_GERAL',
    ],
    description: 'Categoria à qual o serviço pertence',
  })
  categoria!: CategoriaServico

  @ApiPropertyOptional({
    example: 'Troca de óleo sintético 5W30 e substituição do filtro de óleo.',
    nullable: true,
    description: 'Descrição detalhada do serviço',
  })
  descricao?: string | null

  @ApiProperty({
    example: 150.0,
    description: 'Valor base/referência do serviço em reais',
  })
  valorReferencia!: number

  @ApiPropertyOptional({
    example: '2026-03-30T14:00:00.000Z',
    nullable: true,
    description: 'Data de criação do registro',
  })
  criadoEm?: Date | null

  @ApiPropertyOptional({
    example: '2026-03-30T15:30:00.000Z',
    nullable: true,
    description: 'Data da última atualização',
  })
  atualizadoEm?: Date | null

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Data em que o serviço foi desativado/inativado',
  })
  desativadoEm?: Date | null
}