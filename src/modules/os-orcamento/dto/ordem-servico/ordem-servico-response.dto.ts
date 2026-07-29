import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'
import type {
  TipoProduto,
  UnidadeMedida,
} from '@/modules/estoque/domain/entities/produto.js'

const CATEGORIAS_SERVICO = [
  'SEGURANCA',
  'MANUTENCAO_PREVENTIVA',
  'ESTETICA',
  'ELETRICA',
  'MECANICA_GERAL',
] as const

const TIPOS_PRODUTO = ['PECA', 'INSUMO'] as const
const UNIDADES_MEDIDA = ['UN', 'L', 'KG', 'JOGO', 'METRO'] as const

export class OsServicoResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do item de serviço retornado pela OS',
  })
  id!: string

  @ApiProperty({
    example: 'Troca de Óleo e Filtro',
    description: 'Nome do serviço',
  })
  nome!: string

  @ApiProperty({
    example: 'MANUTENCAO_PREVENTIVA',
    enum: CATEGORIAS_SERVICO,
    description: 'Categoria do serviço',
  })
  categoria!: CategoriaServico

  @ApiPropertyOptional({
    example: 'Substituição completa do óleo e filtro do motor.',
    nullable: true,
    description: 'Descrição detalhada do serviço',
  })
  descricao?: string | null

  @ApiProperty({
    example: 15000,
    description: 'Preço unitário cobrado pelo serviço',
  })
  precoUnitario!: number

  @ApiPropertyOptional({
    example: '2026-03-30T14:00:00.000Z',
    nullable: true,
  })
  criadoEm?: Date | null
}

export class OsComponenteResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do componente/peça vinculado à OS',
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
    description: 'Tipo do produto (PECA ou INSUMO)',
  })
  tipo!: TipoProduto

  @ApiPropertyOptional({
    example: 'Motul',
    nullable: true,
    description: 'Marca do fabricante',
  })
  marca?: string | null

  @ApiPropertyOptional({
    example: 'SKU-88901',
    nullable: true,
    description: 'Código SKU',
  })
  codigoSKU?: string | null

  @ApiPropertyOptional({
    example: 'FAB-55412',
    nullable: true,
    description: 'Código do fabricante',
  })
  codigoFabricante?: string | null

  @ApiPropertyOptional({
    example: 'Filtro blindado para alta performance',
    nullable: true,
    description: 'Descrição do componente',
  })
  descricao?: string | null

  @ApiProperty({
    example: 2,
    description: 'Quantidade utilizada do produto',
  })
  quantidade!: number

  @ApiProperty({
    example: 3550,
    description: 'Preço de custo unitário em centavos',
  })
  precoCusto!: number

  @ApiProperty({
    example: 6500,
    description: 'Preço unitário de venda cobrado',
  })
  precoUnitario!: number

  @ApiPropertyOptional({
    example: 'UN',
    enum: UNIDADES_MEDIDA,
    nullable: true,
    description: 'Unidade de medida do produto',
  })
  unidadeMedida?: UnidadeMedida | null

  @ApiPropertyOptional({
    example: '2026-03-30T14:00:00.000Z',
    nullable: true,
  })
  criadoEm?: Date | null
}

export class OrdemServicoResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único da Ordem de Serviço (UUID)',
  })
  id!: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'ID do cliente proprietário do veículo',
  })
  clienteId!: string

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
    description: 'ID do mecânico responsável atribuído',
  })
  mecanicoId?: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174003',
    description: 'ID do veículo em manutenção',
  })
  veiculoId!: string

  @ApiProperty({
    example: 'Revisão preventiva de 40.000 km com barulho no freio dianteiro.',
    description: 'Descrição do problema ou serviço a ser realizado',
  })
  descricao!: string

  @ApiProperty({
    example: 'MEDIA',
    description: 'Nível de prioridade da OS',
  })
  prioridade!: string

  @ApiProperty({
    example: false,
    description: 'Indica se a manutenção é coberta por garantia',
  })
  garantia!: boolean

  @ApiProperty({
    example: 'RECEBIDA',
    description: 'Status atual da Ordem de Serviço',
  })
  status!: string

  @ApiProperty({
    type: [OsServicoResponseDto],
    description: 'Lista de serviços associados à OS',
  })
  servicos!: OsServicoResponseDto[]

  @ApiProperty({
    type: [OsComponenteResponseDto],
    description: 'Lista de componentes/produtos associados à OS',
  })
  componentes!: OsComponenteResponseDto[]

  @ApiProperty({ example: '2026-03-30T14:00:00.000Z' })
  criadoEm!: Date

  @ApiPropertyOptional({ example: '2026-03-30T15:30:00.000Z', nullable: true })
  atualizadoEm?: Date
}