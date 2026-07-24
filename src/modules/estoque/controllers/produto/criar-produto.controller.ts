import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { CriarProdutoUseCase } from '../../application/use-cases/criar-produto.js'
import { CriarProdutoBodyDto } from '../../dto/criar-produto-body.dto.js'
import { ProdutoPresenter } from '../../presenters/produto-presenter.js'

@Controller('produtos')
export class CriarProdutoController {
  constructor(private readonly criarProduto: CriarProdutoUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: CriarProdutoBodyDto) {
    try {
      const { produto } = await this.criarProduto.execute(body)
      return ProdutoPresenter.toHTTP(produto)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}