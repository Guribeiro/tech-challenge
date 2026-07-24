import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UnauthorizedException
} from '@nestjs/common'
import { DesativarServicoUseCase } from '../../application/use-cases/servicos/desativar-servico.js'

@Controller('servicos')
export class DesativarServicoController {
  constructor(private readonly desativarServico: DesativarServicoUseCase) { }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async handle(@Param('id') id: string,) {
    try {
      await this.desativarServico.execute({
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