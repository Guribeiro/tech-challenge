import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class ConsultarSituacaoOSPublicoQueryDto {
  @ApiProperty({
    example: 'ABC1D23',
    description: 'Placa do veículo cadastrado na ordem de serviço',
  })
  @IsString({ message: 'A placa deve ser um texto.' })
  @IsNotEmpty({ message: 'A placa é obrigatória.' })
  @MaxLength(10, { message: 'A placa deve ter no máximo 10 caracteres.' })
  placa!: string

  @ApiProperty({
    example: '52998224725',
    description: 'Documento (CPF ou CNPJ) do cliente associado',
  })
  @IsString({ message: 'O documento deve ser um texto.' })
  @IsNotEmpty({ message: 'O documento é obrigatório.' })
  @MaxLength(18, { message: 'O documento deve ter no máximo 18 caracteres.' })
  documento!: string
}
