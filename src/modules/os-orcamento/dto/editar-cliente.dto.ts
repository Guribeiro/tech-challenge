import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator'

export class EditarClienteBodyDto {
  @IsString()
  @IsNotEmpty()
  nome!: string

  @IsEmail()
  @IsNotEmpty()
  email!: string

  @IsString()
  @IsNotEmpty()
  telefone!: string

  @IsIn(['PF', 'PJ'])
  @IsNotEmpty()
  tipo!: 'PF' | 'PJ'
}