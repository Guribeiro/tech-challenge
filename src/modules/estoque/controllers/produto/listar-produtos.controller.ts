import { Controller, Get, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common'
import { ListarProdutosUseCase } from '../../application/use-cases/listar-produtos.js'
import { ProdutoPresenter } from '../../presenters/produto-presenter.js'
import { ListarProdutosQueryDto } from '../../dto/listar-produtos-query.dto.js'

@Controller('produtos')
export class ListarProdutosController {
  constructor(private readonly listarProdutos: ListarProdutosUseCase) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async handle(@Query() query: ListarProdutosQueryDto) {
    try {
      const output = await this.listarProdutos.execute({
        pagina: query.pagina,
        limite: query.limite,
        status: query.status,
        nome: query.nome,
      })

      return {
        produtos: output.produtos.map(ProdutoPresenter.toHTTP),
        meta: {
          total: output.total,
          pagina: output.pagina,
          limite: output.limite,
          totalPaginas: Math.ceil(output.total / output.limite),
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}