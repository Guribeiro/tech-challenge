import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class ComponenteItemDto {
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

export class CriarOrdemServicoBodyDto {
  @IsUUID('4', { message: 'O ID do cliente deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do cliente é obrigatório.' })
  clienteId!: string

  @IsUUID('4', { message: 'O ID do veículo deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do veículo é obrigatório.' })
  veiculoId!: string

  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'A descrição da ordem de serviço é obrigatória.' })
  descricao!: string

  @IsBoolean({ message: 'O campo eGarantia deve ser um booleano.' })
  eGarantia!: boolean

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