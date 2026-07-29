// src/infra/http/dto/ordem-servico/componente-item.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator'

export class ComponenteItemDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID opcional do item de componente já existente na OS (UUID v4)',
  })
  @IsUUID('4', { message: 'O ID do componente deve ser um UUID válido.' })
  @IsOptional()
  id?: string

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
    description: 'Quantidade do produto necessária para a manutenção',
  })
  @IsNumber({}, { message: 'A quantidade deve ser um número.' })
  @Min(1, { message: 'A quantidade deve ser maior ou igual a 1.' })
  quantidade!: number
}