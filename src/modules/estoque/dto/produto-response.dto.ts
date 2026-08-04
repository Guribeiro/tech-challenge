// src/infra/http/dto/produto/produto-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type {
  TipoProduto,
  UnidadeMedida,
} from '@/modules/estoque/domain/entities/produto.js'

const TIPOS_PRODUTO = ['PECA', 'INSUMO'] as const
const UNIDADES_MEDIDA = ['UN', 'L', 'KG', 'JOGO', 'METRO'] as const

export class ProdutoResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único do produto (UUID)',
  })
  id!: string

  @ApiProperty({
    example: 'Filtro de Óleo Motul 5W30',
    description: 'Nome do produto',
  })
  nome!: string

  @ApiProperty({
    example: 'PECA',
    enum: TIPOS_PRODUTO,
    description: 'Tipo do produto',
  })
  tipo!: TipoProduto

  @ApiPropertyOptional({
    example: 'Motul',
    nullable: true,
    description: 'Marca do produto',
  })
  marca?: string | null

  @ApiPropertyOptional({
    example: 'SKU-88901',
    nullable: true,
    description: 'Código SKU único',
  })
  codigoSKU?: string | null

  @ApiPropertyOptional({
    example: 'FAB-55412',
    nullable: true,
    description: 'Código do fabricante',
  })
  codigoFabricante?: string | null

  @ApiPropertyOptional({
    example: 'Filtro blindado para motores de alta performance.',
    nullable: true,
    description: 'Descrição detalhada',
  })
  descricao?: string | null

  @ApiProperty({
    example: 35.5,
    description: 'Preço de custo do produto em reais',
  })
  precoCusto!: number

  @ApiProperty({
    example: 65.0,
    description: 'Preço de venda unitário em reais',
  })
  precoUnitario!: number

  @ApiProperty({
    example: 100,
    description: 'Quantidade total no estoque físico',
  })
  quantidadeEstoque!: number

  @ApiProperty({
    example: 5,
    description: 'Quantidade reservada em ordens de serviço ativas',
  })
  quantidadeReservada!: number

  @ApiProperty({
    example: 95,
    description: 'Quantidade disponível para venda (Estoque físico - Reservas)',
  })
  quantidadeDisponivel!: number

  @ApiPropertyOptional({
    example: 10,
    nullable: true,
    description: 'Estoque mínimo para alerta de reposição',
  })
  estoqueMinimo?: number | null

  @ApiPropertyOptional({
    example: 200,
    nullable: true,
    description: 'Estoque máximo suportado',
  })
  estoqueMaximo?: number | null

  @ApiPropertyOptional({
    example: 'UN',
    enum: UNIDADES_MEDIDA,
    nullable: true,
    description: 'Unidade de medida',
  })
  unidadeMedida?: UnidadeMedida | null

  @ApiPropertyOptional({
    example: 'Prateleira A2 - Corredor 3',
    nullable: true,
    description: 'Localização física na oficina/almoxarifado',
  })
  localizacao?: string | null

  @ApiPropertyOptional({ example: '2026-03-30T14:00:00.000Z', nullable: true })
  criadoEm?: Date | null

  @ApiPropertyOptional({ example: '2026-03-30T15:30:00.000Z', nullable: true })
  atualizadoEm?: Date | null

  @ApiPropertyOptional({ example: null, nullable: true })
  desativadoEm?: Date | null
}