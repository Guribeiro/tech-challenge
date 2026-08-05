import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator'

export class ServicoItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do serviço diagnosticado a ser incluído na OS (UUID v4)',
  })
  @IsUUID('4', { message: 'O ID do serviço deve ser um UUID válido.' })
  @IsOptional({ message: 'O ID do serviço é opcional.' })
  id?: string
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do serviço diagnosticado a ser incluído na OS (UUID v4)',
  })
  @IsUUID('4', { message: 'O ID do serviço deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do serviço é obrigatório.' })
  servicoId!: string
}