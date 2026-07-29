import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator'

export class EditarClienteBodyDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  nome!: string

  @ApiProperty({ example: 'joao.silva@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @ApiProperty({ example: '11999998888' })
  @IsString()
  @IsNotEmpty()
  telefone!: string

  @ApiProperty({
    description: 'Tipo do cliente',
    example: 'PF',
  })
  @IsString({ message: 'O tipo do cliente deve ser uma string' })
  @IsIn(['PF', 'PJ'], { message: 'O tipo do cliente deve ser PF ou PJ' })
  @IsNotEmpty()
  tipo!: 'PF' | 'PJ'
}