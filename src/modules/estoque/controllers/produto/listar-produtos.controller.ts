import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ListarProdutosUseCase } from '../../application/use-cases/listar-produtos.js'
import { ProdutoPresenter } from '../../presenters/produto-presenter.js'
import { ListarProdutosQueryDto } from '../../dto/listar-produtos-query.dto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { ListarProdutosResponseDto } from '../../dto/listar-produtos-response.dto.js'

@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('produtos')
export class ListarProdutosController {
  constructor(private readonly listarProdutos: ListarProdutosUseCase) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar produtos com paginação e filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de produtos retornada com sucesso.',
    type: ListarProdutosResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado ou erro na busca.',
  })
  async handle(@Query() query: ListarProdutosQueryDto) {
    const result = await this.listarProdutos.execute({
      tipo: query.tipo,
      pagina: query.pagina,
      limite: query.limite,
      status: query.status,
      nome: query.nome,
    })

    const { produtos, limite, pagina, total } = unwrapEither(result)

    return {
      produtos: produtos.map(ProdutoPresenter.toHTTP),
      meta: {
        total: total,
        pagina: pagina,
        limite: limite,
        totalPaginas: Math.ceil(total / limite),
      },
    }
  }
}