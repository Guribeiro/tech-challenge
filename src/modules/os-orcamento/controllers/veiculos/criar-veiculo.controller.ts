import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { CriarVeiculoUseCase } from '../../application/use-cases/veiculos/criar-veiculo.js'
import { CriarVeiculoBodyDto } from '../../dto/criar-veiculo.dto.js'
import { VeiculoPresenter } from '../../presenters/veiculo-presenter.js'

@Controller('veiculos')
export class CriarVeiculoController {
  constructor(private readonly criarVeiculo: CriarVeiculoUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: CriarVeiculoBodyDto) {
    try {
      const { veiculo } = await this.criarVeiculo.execute(body)
      return VeiculoPresenter.toHTTP(veiculo)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}