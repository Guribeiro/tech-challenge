import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty
} from 'class-validator'
import { type CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { type EditarServicoInput } from '@/modules/os-orcamento/application/use-cases/servicos/editar-servico.js'

export class EditarServicoBodyDto implements Omit<EditarServicoInput, 'id'> {
  @IsOptional()
  @IsString({ message: 'O nome do serviço deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do serviço não pode ser vazio.' })
  nome?: string

  @IsOptional()
  @IsEnum(
    ['SEGURANCA', 'MANUTENCAO_PREVENTIVA', 'ESTETICA', 'ELETRICA', 'MECANICA_GERAL'],
    {
      message:
        'A categoria informada é inválida. Categorias permitidas: SEGURANCA, MANUTENCAO_PREVENTIVA, ESTETICA, ELETRICA, MECANICA_GERAL.',
    },
  )
  categoria?: CategoriaServico

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao?: string

  @IsOptional()
  @IsNumber({}, { message: 'O valor de referência deve ser um número válido.' })
  @Min(0, { message: 'O valor de referência não pode ser negativo.' })
  valorReferencia?: number
}