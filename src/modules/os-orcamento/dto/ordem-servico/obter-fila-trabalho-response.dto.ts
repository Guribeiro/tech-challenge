import { ApiProperty } from "@nestjs/swagger"
import { MetaPaginacaoResponseDto } from "../../../../infra/http/dto/meta-paginacao-response.dto.js"
import { OrdemServicoResponseDto } from "./ordem-servico-response.dto.js"

export class ObterFilaTrabalhoResponseDto {
  @ApiProperty({ type: [OrdemServicoResponseDto] })
  fila!: OrdemServicoResponseDto[]

  @ApiProperty({ type: MetaPaginacaoResponseDto })
  meta!: MetaPaginacaoResponseDto
}