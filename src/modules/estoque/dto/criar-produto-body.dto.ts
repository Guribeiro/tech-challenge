// src/infra/http/dto/produto/criar-produto-body.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
} from 'class-validator'
import {
  type TipoProduto,
  type UnidadeMedida,
} from '@/modules/estoque/domain/entities/produto.js'
import { CriarProdutoInput } from '@/modules/estoque/application/use-cases/criar-produto.js'

const TIPOS_PRODUTO = ['PECA', 'INSUMO'] as const
const UNIDADES_MEDIDA = ['UN', 'L', 'KG', 'JOGO', 'METRO'] as const

export class CriarProdutoBodyDto implements CriarProdutoInput {
  @ApiProperty({
    example: 'Filtro de Óleo Motul 5W30',
    description: 'Nome do produto',
  })
  @IsString({ message: 'O nome do produto deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do produto é obrigatório.' })
  nome!: string

  @ApiProperty({
    example: 'PECA',
    enum: TIPOS_PRODUTO,
    description: 'Tipo do produto (PECA ou INSUMO)',
  })
  @IsEnum(TIPOS_PRODUTO, {
    message: 'O tipo do produto deve ser PECA ou INSUMO.',
  })
  tipo!: TipoProduto

  @ApiPropertyOptional({
    example: 'Motul',
    description: 'Marca do produto',
  })
  @IsOptional()
  @IsString({ message: 'A marca deve ser um texto.' })
  marca?: string

  @ApiPropertyOptional({
    example: 'SKU-88901',
    description: 'Código SKU único',
  })
  @IsOptional()
  @IsString({ message: 'O código SKU deve ser um texto.' })
  codigoSKU?: string

  @ApiPropertyOptional({
    example: 'FAB-55412',
    description: 'Código do fabricante',
  })
  @IsOptional()
  @IsString({ message: 'O código do fabricante deve ser um texto.' })
  codigoFabricante?: string

  @ApiPropertyOptional({
    example: 'Filtro blindado para motores de alta performance.',
    description: 'Descrição do produto',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao?: string

  @ApiProperty({
    example: 3550,
    description: 'Preço de custo em centavos',
  })
  @IsNumber({}, { message: 'O preço de custo deve ser um número válido.' })
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  precoCusto!: number

  @ApiProperty({
    example: 6500,
    description: 'Preço unitário de venda em centavos',
  })
  @IsNumber({}, { message: 'O preço unitário deve ser um número válido.' })
  @Min(0, { message: 'O preço unitário de venda não pode ser negativo.' })
  precoUnitario!: number

  @ApiProperty({
    example: 100,
    description: 'Quantidade inicial em estoque',
  })
  @IsInt({ message: 'A quantidade em estoque deve ser um número inteiro.' })
  @Min(0, { message: 'A quantidade em estoque não pode ser negativa.' })
  quantidadeEstoque!: number

  @ApiPropertyOptional({
    example: 10,
    description: 'Estoque mínimo aceitável',
  })
  @IsOptional()
  @IsInt({ message: 'O estoque mínimo deve ser um número inteiro.' })
  @Min(0, { message: 'O estoque mínimo não pode ser negativo.' })
  estoqueMinimo?: number

  @ApiPropertyOptional({
    example: 200,
    description: 'Estoque máximo suportado',
  })
  @IsOptional()
  @IsInt({ message: 'O estoque máximo deve ser um número inteiro.' })
  @Min(0, { message: 'O estoque máximo não pode ser negativo.' })
  estoqueMaximo?: number

  @ApiPropertyOptional({
    example: 'UN',
    enum: UNIDADES_MEDIDA,
    description: 'Unidade de medida',
  })
  @IsOptional()
  @IsEnum(UNIDADES_MEDIDA, {
    message: 'A unidade de medida fornecida é inválida.',
  })
  unidadeMedida?: UnidadeMedida

  @ApiPropertyOptional({
    example: 'Prateleira A2 - Corredor 3',
    description: 'Localização física no almoxarifado',
  })
  @IsOptional()
  @IsString({ message: 'A localização deve ser um texto.' })
  localizacao?: string
}