import { Controller, Delete, HttpCode, HttpStatus, Param, UnauthorizedException } from '@nestjs/common'
import { DeletarVeiculoUseCase } from '../../application/use-cases/veiculos/deletar-veiculo.js'

@Controller('veiculos')
export class DeletarVeiculoController {
  constructor(private readonly deletarVeiculo: DeletarVeiculoUseCase) { }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('id') id: string,
  ) {
    try {
      await this.deletarVeiculo.execute({
        id
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}