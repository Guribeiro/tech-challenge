// src/infra/http/dto/autenticar.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class AutenticarBodyDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'E-mail cadastrado do usuário',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty()
  email!: string

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuário',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  senha!: string
}