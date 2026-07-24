import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UnauthorizedException
} from '@nestjs/common'
import { ReativarProdutoUseCase } from '../../application/use-cases/reativar-produto.js'

@Controller('produtos')
export class ReativarProdutoController {
  constructor(private readonly reativar: ReativarProdutoUseCase) { }

  @Patch(':id/reativar')
  @HttpCode(HttpStatus.OK)
  async handle(@Param('id') id: string,) {
    try {
      await this.reativar.execute({
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