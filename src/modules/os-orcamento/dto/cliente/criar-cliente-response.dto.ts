import { ApiProperty } from '@nestjs/swagger'
import { ClienteResponseDto } from './cliente-response.dto.js'

export class CriarClienteResponseDto {
  @ApiProperty({
    type: () => ClienteResponseDto,
  })
  cliente!: ClienteResponseDto
}