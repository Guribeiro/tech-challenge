import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { type TipoProduto, type UnidadeMedida } from '@/modules/estoque/domain/entities/produto.js'
import { CriarProdutoInput } from '@/modules/estoque/application/use-cases/criar-produto.js'

export class CriarProdutoBodyDto implements CriarProdutoInput {
  @IsString({ message: 'O nome do produto deve ser um texto.' })
  nome!: string

  @IsEnum(['PECA', 'INSUMO'], {
    message: 'O tipo do produto deve ser PECA ou INSUMO.',
  })
  tipo!: TipoProduto

  @IsOptional()
  @IsString({ message: 'A marca deve ser um texto.' })
  marca?: string

  @IsOptional()
  @IsString({ message: 'O código SKU deve ser um texto.' })
  codigoSKU?: string

  @IsOptional()
  @IsString({ message: 'O código do fabricante deve ser um texto.' })
  codigoFabricante?: string

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao?: string

  @IsNumber({}, { message: 'O preço de custo deve ser um número válido.' })
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  precoCusto!: number

  @IsNumber({}, { message: 'O preço unitário deve ser um número válido.' })
  @Min(0, { message: 'O preço unitário de venda não pode ser negativo.' })
  precoUnitario!: number

  @IsInt({ message: 'A quantidade em estoque deve ser um número inteiro.' })
  @Min(0, { message: 'A quantidade em estoque não pode ser negativa.' })
  quantidadeEstoque!: number

  @IsOptional()
  @IsInt({ message: 'O estoque mínimo deve ser um número inteiro.' })
  @Min(0, { message: 'O estoque mínimo não pode ser negativo.' })
  estoqueMinimo?: number

  @IsOptional()
  @IsInt({ message: 'O estoque máximo deve ser um número inteiro.' })
  @Min(0, { message: 'O estoque máximo não pode ser negativo.' })
  estoqueMaximo?: number

  @IsOptional()
  @IsEnum(['UN', 'L', 'KG', 'JOGO', 'METRO'], {
    message: 'A unidade de medida fornecida é inválida.',
  })
  unidadeMedida?: UnidadeMedida

  @IsOptional()
  @IsString({ message: 'A localização deve ser um texto.' })
  localizacao?: string
}