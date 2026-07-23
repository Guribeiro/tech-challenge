import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'

export class CriarVeiculoBodyDto {
  @IsString({ message: 'O ID do cliente deve ser uma string' })
  @IsNotEmpty({ message: 'O ID do cliente é obrigatório' })
  clienteId!: string

  @IsString({ message: 'A placa deve ser uma string' })
  @IsNotEmpty({ message: 'A placa é obrigatória' })
  @MinLength(7, { message: 'A placa deve ter no mínimo 7 caracteres' })
  placa!: string

  @IsString({ message: 'A marca deve ser uma string' })
  @IsNotEmpty({ message: 'A marca é obrigatória' })
  marca!: string

  @IsString({ message: 'O modelo deve ser uma string' })
  @IsNotEmpty({ message: 'O modelo é obrigatório' })
  modelo!: string

  @IsInt({ message: 'O ano deve ser um número inteiro' })
  @Min(1900, { message: 'Ano inválido (mínimo 1900)' })
  @Max(new Date().getFullYear() + 1, { message: 'Ano não pode ser no futuro' })
  @IsNotEmpty({ message: 'O ano é obrigatório' })
  ano!: number

  @IsOptional()
  @IsString({ message: 'A cor deve ser uma string' })
  cor?: string

  @IsOptional()
  @IsNumber({}, { message: 'A quilometragem deve ser um número' })
  @Min(0, { message: 'A quilometragem não pode ser negativa' })
  quilometragem?: number

  @IsOptional()
  @IsString({ message: 'O combustível deve ser uma string' })
  combustivel?: string

  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  observacoes?: string
}