import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UnauthorizedException
} from '@nestjs/common'
import { ReativarServicoUseCase } from '../../application/use-cases/servicos/reativar-servico.js'

@Controller('servicos')
export class ReativarServicoController {
  constructor(private readonly reativarServico: ReativarServicoUseCase) { }

  @Patch(':id/reativar')
  @HttpCode(HttpStatus.OK)
  async handle(@Param('id') id: string,) {
    try {
      await this.reativarServico.execute({
        servicoId: id
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}