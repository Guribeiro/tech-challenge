// src/infra/http/dto/ordem-servico/criar-ordem-servico-body.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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

export class ServicoItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do serviço a ser realizado (UUID v4)',
  })
  @IsUUID('4', { message: 'O ID do serviço deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do serviço é obrigatório.' })
  servicoId!: string
}

export class ComponenteItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'ID do produto/peça a ser utilizado (UUID v4)',
  })
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório.' })
  produtoId!: string

  @ApiProperty({
    example: 2,
    minimum: 1,
    description: 'Quantidade do produto utilizada na ordem de serviço',
  })
  @IsNumber({}, { message: 'A quantidade deve ser um número.' })
  @Min(1, { message: 'A quantidade deve ser maior ou igual a 1.' })
  quantidade!: number
}

export class CriarOrdemServicoBodyDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'ID do cliente proprietário do veículo (UUID v4)',
  })
  @IsUUID('4', { message: 'O ID do cliente deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do cliente é obrigatório.' })
  clienteId!: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174003',
    description: 'ID do veículo em manutenção (UUID v4)',
  })
  @IsUUID('4', { message: 'O ID do veículo deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do veículo é obrigatório.' })
  veiculoId!: string

  @ApiProperty({
    example: 'Revisão geral do sistema de freios e troca de óleo.',
    description: 'Descrição detalhada do problema relatado ou serviço solicitado',
  })
  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'A descrição da ordem de serviço é obrigatória.' })
  descricao!: string

  @ApiProperty({
    example: false,
    description: 'Indica se a manutenção será realizada sob garantia',
  })
  @IsBoolean({ message: 'O campo eGarantia deve ser um booleano.' })
  eGarantia!: boolean

  @ApiPropertyOptional({
    type: [ServicoItemDto],
    description: 'Lista de serviços a serem vinculados à ordem de serviço',
  })
  @IsOptional()
  @IsArray({ message: 'Serviços deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ServicoItemDto)
  servicos?: ServicoItemDto[]

  @ApiPropertyOptional({
    type: [ComponenteItemDto],
    description: 'Lista de produtos/peças a serem vinculados à ordem de serviço',
  })
  @IsOptional()
  @IsArray({ message: 'Componentes deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ComponenteItemDto)
  componentes?: ComponenteItemDto[]
}