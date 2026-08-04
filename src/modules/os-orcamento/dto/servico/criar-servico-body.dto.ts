// src/infra/http/dto/criar-servico.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
} from 'class-validator'
import { type CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { CriarServicoInput } from '@/modules/os-orcamento/application/use-cases/servicos/criar-servico.js'

const CATEGORIAS_VALIDAS = [
  'SEGURANCA',
  'MANUTENCAO_PREVENTIVA',
  'ESTETICA',
  'ELETRICA',
  'MECANICA_GERAL',
] as const

export class CriarServicoBodyDto implements CriarServicoInput {
  @ApiProperty({
    example: 'Troca de Óleo e Filtro',
    description: 'Nome do serviço prestado na oficina',
  })
  @IsString({ message: 'O nome do serviço deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do serviço é obrigatório.' })
  nome!: string

  @ApiProperty({
    example: 'MANUTENCAO_PREVENTIVA',
    enum: CATEGORIAS_VALIDAS,
    description: 'Categoria técnica do serviço',
  })
  @IsEnum(CATEGORIAS_VALIDAS, {
    message:
      'A categoria informada é inválida. Categorias permitidas: SEGURANCA, MANUTENCAO_PREVENTIVA, ESTETICA, ELETRICA, MECANICA_GERAL.',
  })
  categoria!: CategoriaServico

  @ApiPropertyOptional({
    example: 'Substituição do óleo do motor sintético 5W30 e troca do filtro de óleo.',
    description: 'Descrição detalhada do que está incluso no serviço',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao?: string

  @ApiProperty({
    example: 180,
    description: 'Valor padrão/referência cobrado pelo serviço em reais',
  })
  @IsNumber({}, { message: 'O valor de referência deve ser um número válido.' })
  @Min(0, { message: 'O valor de referência não pode ser negativo.' })
  valorReferencia!: number
}