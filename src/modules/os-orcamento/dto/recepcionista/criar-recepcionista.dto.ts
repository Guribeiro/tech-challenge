import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CriarRecepcionistaBodyDto {
  @ApiProperty({ example: 'Carlos Silva' })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  nome!: string

  @ApiProperty({ example: '12345678901' })
  @IsString({ message: 'O CPF deve ser uma string' })
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  cpf!: string

  @ApiProperty({ example: 'carlos.mecanico@email.com' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string
}