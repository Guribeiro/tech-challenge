import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { CriarServicoUseCase } from '../../application/use-cases/servicos/criar-servico.js'
import { ServicoPresenter } from '../../presenters/servico-presenter.js'
import { CriarServicoBodyDto } from '../../dto/criar-servico-body.dto.js'

@Controller('servicos')
export class CriarServicoController {
  constructor(private readonly criarServico: CriarServicoUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: CriarServicoBodyDto) {
    try {
      const { servico } = await this.criarServico.execute(body)
      return ServicoPresenter.toHTTP(servico)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}