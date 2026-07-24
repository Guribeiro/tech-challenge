import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { CriarOrdemServicoUseCase } from '../../application/use-cases/ordens-servicos/criar-ordem-servico.js'
import { CriarOrdemServicoBodyDto } from '../../dto/criar-ordem-servico-body.dto.js'
import { OrdemServicoPresenter } from '../../presenters/ordem-servico-presenter.js'

@Controller('ordens-servicos')
export class CriarOrdemServicoController {
  constructor(private readonly criarOrdemServico: CriarOrdemServicoUseCase) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(@Body() body: CriarOrdemServicoBodyDto) {
    try {
      const { ordemServico } = await this.criarOrdemServico.execute(body)
      return OrdemServicoPresenter.toHTTP(ordemServico)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}