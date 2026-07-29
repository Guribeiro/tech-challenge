import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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

export class EditarVeiculoBodyDto {
  @ApiProperty({
    example: 'ABC1D23',
    description: 'Placa do veículo (padrão antigo ou Mercosul)',
  })
  @IsString({ message: 'A placa deve ser uma string' })
  @IsNotEmpty({ message: 'A placa é obrigatória' })
  @MinLength(7, { message: 'A placa deve ter no mínimo 7 caracteres' })
  placa!: string

  @ApiProperty({ example: 'Toyota' })
  @IsString({ message: 'A marca deve ser uma string' })
  @IsNotEmpty({ message: 'A marca é obrigatória' })
  marca!: string

  @ApiProperty({ example: 'Corolla' })
  @IsString({ message: 'O modelo deve ser uma string' })
  @IsNotEmpty({ message: 'O modelo é obrigatório' })
  modelo!: string

  @ApiProperty({ example: 2022 })
  @IsInt({ message: 'O ano deve ser um número inteiro' })
  @Min(1900, { message: 'Ano inválido (mínimo 1900)' })
  @Max(new Date().getFullYear() + 1, { message: 'Ano não pode ser no futuro' })
  @IsNotEmpty({ message: 'O ano é obrigatório' })
  ano!: number

  @ApiPropertyOptional({ example: 'Preto' })
  @IsOptional()
  @IsString({ message: 'A cor deve ser uma string' })
  cor?: string

  @ApiPropertyOptional({ example: 48000 })
  @IsOptional()
  @IsNumber({}, { message: 'A quilometragem deve ser um número' })
  @Min(0, { message: 'A quilometragem não pode ser negativa' })
  quilometragem?: number

  @ApiPropertyOptional({ example: 'Flex' })
  @IsOptional()
  @IsString({ message: 'O combustível deve ser uma string' })
  combustivel?: string

  @ApiPropertyOptional({ example: 'Revisão dos 40.000 km concluída' })
  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  observacoes?: string
}