import { Body, Controller, HttpCode, HttpStatus, Param, Post, Put, UnauthorizedException } from '@nestjs/common'
import { EditarVeiculoUseCase } from '../../application/use-cases/veiculos/editar-veiculo.js'
import { EditarVeiculoBodyDto } from '../../dto/editar-veiculo.dto.js'
import { VeiculoPresenter } from '../../presenters/veiculo-presenter.js'

@Controller('veiculos')
export class EditarVeiculoController {
  constructor(private readonly editarVeiculo: EditarVeiculoUseCase) { }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('id') id: string,
    @Body() body: EditarVeiculoBodyDto
  ) {
    try {
      const { veiculo } = await this.editarVeiculo.execute({
        id,
        ...body
      })
      return VeiculoPresenter.toHTTP(veiculo)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}