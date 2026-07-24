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

export class CriarServicoBodyDto implements CriarServicoInput {
  @IsString({ message: 'O nome do serviço deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do serviço é obrigatório.' })
  nome!: string

  @IsEnum(
    ['SEGURANCA', 'MANUTENCAO_PREVENTIVA', 'ESTETICA', 'ELETRICA', 'MECANICA_GERAL'],
    {
      message:
        'A categoria informada é inválida. Categorias permitidas: SEGURANCA, MANUTENCAO_PREVENTIVA, ESTETICA, ELETRICA, MECANICA_GERAL.',
    },
  )
  categoria!: CategoriaServico

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao?: string

  @IsNumber({}, { message: 'O valor de referência deve ser um número válido.' })
  @Min(0, { message: 'O valor de referência não pode ser negativo.' })
  valorReferencia!: number
}