import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class ComponenteItemDto {
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido.' })
  @IsOptional()
  id!: string

  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório.' })
  produtoId!: string

  @IsNumber({}, { message: 'A quantidade deve ser um número.' })
  @Min(1, { message: 'A quantidade deve ser maior ou igual a 1.' })
  quantidade!: number
}

export class ServicoItemDto {
  @IsUUID('4', { message: 'O ID do serviço deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do serviço é obrigatório.' })
  servicoId!: string
}

export class ConcluirDiagnosticoBodyDto {
  @IsOptional()
  @IsArray({ message: 'Serviços deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ServicoItemDto)
  servicos?: ServicoItemDto[]

  @IsOptional()
  @IsArray({ message: 'Componentes deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ComponenteItemDto)
  componentes?: ComponenteItemDto[]
}