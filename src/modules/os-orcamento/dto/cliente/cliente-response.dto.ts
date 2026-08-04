import { ApiProperty } from '@nestjs/swagger'

export class ClienteResponseDto {
  @ApiProperty({
    description: 'Identificador único do cliente (UUID)',
    example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
  })
  id!: string

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João da Silva',
  })
  nome!: string

  @ApiProperty({
    description: 'E-mail do cliente',
    example: 'joao.silva@email.com',
  })
  email!: string

  @ApiProperty({
    description: 'CPF do cliente',
    example: '123.456.789-00',
  })
  cpf!: string

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '(11) 98765-4321',
  })
  telefone!: string

  @ApiProperty({
    description: 'Tipo do cliente',
    example: 'PF',
  })
  tipo!: string

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2026-07-28T19:35:00.000Z',
  })
  criadoEm!: Date

  @ApiProperty({
    description: 'Data da última atualização do registro',
    example: '2026-07-28T19:35:00.000Z',
    nullable: true,
  })
  atualizadoEm?: Date | null

  @ApiProperty({
    description: 'Data de deleção do registro (Soft Delete)',
    example: null,
    nullable: true,
  })
  deletadoEm?: Date | null
}