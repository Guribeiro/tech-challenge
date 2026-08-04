import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty
} from 'class-validator'
import type { CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'
import type { EditarServicoInput } from '@/modules/os-orcamento/application/use-cases/servicos/editar-servico.js'
import { ApiPropertyOptional } from '@nestjs/swagger'

const CATEGORIAS_VALIDAS = [
  'SEGURANCA',
  'MANUTENCAO_PREVENTIVA',
  'ESTETICA',
  'ELETRICA',
  'MECANICA_GERAL',
] as const

export class EditarServicoBodyDto implements Omit<EditarServicoInput, 'id'> {
  @ApiPropertyOptional({
    example: 'Troca de Óleo e Filtro Esportivo',
    description: 'Novo nome do serviço',
  })
  @IsOptional()
  @IsString({ message: 'O nome do serviço deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do serviço não pode ser vazio.' })
  nome?: string

  @ApiPropertyOptional({
    example: 'MANUTENCAO_PREVENTIVA',
    enum: CATEGORIAS_VALIDAS,
    description: 'Nova categoria técnica do serviço',
  })
  @IsOptional()
  @IsEnum(CATEGORIAS_VALIDAS, {
    message:
      'A categoria informada é inválida. Categorias permitidas: SEGURANCA, MANUTENCAO_PREVENTIVA, ESTETICA, ELETRICA, MECANICA_GERAL.',
  })
  categoria?: CategoriaServico

  @ApiPropertyOptional({
    example: 'Incluso substituição de filtro e óleo sintético 5W30.',
    description: 'Nova descrição detalhada do serviço',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao?: string

  @ApiPropertyOptional({
    example: 210.0,
    description: 'Novo valor de referência em reais',
  })
  @IsOptional()
  @IsNumber({}, { message: 'O valor de referência deve ser um número válido.' })
  @Min(0, { message: 'O valor de referência não pode ser negativo.' })
  valorReferencia?: number
}