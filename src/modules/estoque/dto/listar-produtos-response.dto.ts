import { ApiProperty } from "@nestjs/swagger"
import { MetaPaginacaoResponseDto } from "@/infra/http/dto/meta-paginacao-response.dto.js"
import { ProdutoResponseDto } from "./produto-response.dto.js"

export class ListarProdutosResponseDto {
  @ApiProperty({ type: [ProdutoResponseDto] })
  produtos!: ProdutoResponseDto[]

  @ApiProperty({ type: MetaPaginacaoResponseDto })
  meta!: MetaPaginacaoResponseDto
}