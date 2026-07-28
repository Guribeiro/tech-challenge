import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CriarClienteBodyDto {
  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João da Silva',
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  nome!: string

  @ApiProperty({
    description: 'E-mail do cliente',
    example: 'joao.silva@email.com',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string

  @ApiProperty({
    description: 'CPF do cliente (com ou sem formatação)',
    example: '123.456.789-00',
  })
  @IsString({ message: 'O CPF/CNPJ deve ser uma string' })
  @IsNotEmpty({ message: 'CPF ou CNPJ é obrigatório' })
  cpf!: string

  @ApiProperty({
    description: 'Telefone de contato do cliente',
    example: '(11) 98765-4321',
  })
  @IsString({ message: 'O telefone deve ser uma string' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telefone!: string

  @ApiProperty({
    description: 'Tipo do cliente',
    example: 'PF',
  })
  @IsString({ message: 'O tipo do cliente deve ser uma string' })
  @IsIn(['PF', 'PJ'], { message: 'O tipo do cliente deve ser PF ou PJ' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  tipo!: 'PF' | 'PJ'
}