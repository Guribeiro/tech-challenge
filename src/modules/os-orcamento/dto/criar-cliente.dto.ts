import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class CriarClienteBodyDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  nome!: string

  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string

  @IsString({ message: 'O CPF/CNPJ deve ser uma string' })
  @IsNotEmpty({ message: 'CPF ou CNPJ é obrigatório' })
  cpf!: string

  @IsString({ message: 'O telefone deve ser uma string' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telefone!: string

  @IsString({ message: 'O tipo do cliente deve ser uma string' })
  @IsIn(['PF', 'PJ'], { message: 'O tipo do cliente deve ser PF ou PJ' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  tipo!: 'PF' | 'PJ'
}