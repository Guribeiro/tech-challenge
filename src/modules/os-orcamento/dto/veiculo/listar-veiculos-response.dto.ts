import { ApiProperty } from "@nestjs/swagger"
import { MetaPaginacaoResponseDto } from "../../../../infra/http/dto/meta-paginacao-response.dto.js"
import { VeiculoResponseDto } from "./veiculo-response.dto.js"

export class ListarVeiculosResponseDto {
  @ApiProperty({ type: [VeiculoResponseDto] })
  veiculos!: VeiculoResponseDto[]

  @ApiProperty({ type: MetaPaginacaoResponseDto })
  meta!: MetaPaginacaoResponseDto
}