import { ApiProperty } from "@nestjs/swagger"
import { MetaPaginacaoResponseDto } from "../../../../infra/http/dto/meta-paginacao-response.dto.js"
import { ServicoResponseDto } from "./servico-response.dto.js"

export class ListarServicosResponseDto {
  @ApiProperty({ type: [ServicoResponseDto] })
  servicos!: ServicoResponseDto[]

  @ApiProperty({ type: MetaPaginacaoResponseDto })
  meta!: MetaPaginacaoResponseDto
}