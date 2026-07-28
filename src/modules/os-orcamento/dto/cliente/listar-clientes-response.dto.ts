import { ApiProperty } from "@nestjs/swagger"
import { MetaPaginacaoResponseDto } from "../meta-paginacao-response.dto.js"
import { ClienteResponseDto } from "./cliente-response.dto.js"

export class ListarClientesResponseDto {
  @ApiProperty({ type: [ClienteResponseDto] })
  clientes!: ClienteResponseDto[]

  @ApiProperty({ type: MetaPaginacaoResponseDto })
  meta!: MetaPaginacaoResponseDto
}