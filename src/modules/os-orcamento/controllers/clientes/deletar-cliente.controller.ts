import { Controller, Delete, HttpCode, HttpStatus, Param, UnauthorizedException } from '@nestjs/common'
import { DeletarClienteUseCase } from '../../application/use-cases/clientes/deletar-cliente.js'
import { ClientePresenter } from '../../presenters/cliente-presenter.js'

@Controller('clientes')
export class DeletarClienteController {
  constructor(private readonly deletarCliente: DeletarClienteUseCase) { }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('id') id: string,
  ) {
    try {
      await this.deletarCliente.execute({
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