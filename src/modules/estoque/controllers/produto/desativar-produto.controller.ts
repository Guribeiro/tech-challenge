import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UnauthorizedException
} from '@nestjs/common'
import { DesativarProdutoUseCase } from '../../application/use-cases/desativar-produto.js'

@Controller('produtos')
export class DesativarProdutoController {
  constructor(private readonly desativarProduto: DesativarProdutoUseCase) { }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async handle(@Param('id') id: string,) {
    try {
      await this.desativarProduto.execute({
        produtoId: id
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}