import { Body, Controller, HttpCode, HttpStatus, Param, Post, Put, UnauthorizedException } from '@nestjs/common'
import { EditarClienteUseCase } from '../../application/use-cases/clientes/editar-cliente.js'
import { EditarClienteBodyDto } from '../../dto/editar-cliente.dto.js'
import { ClientePresenter } from '../../presenters/cliente-presenter.js'

@Controller('clientes')
export class EditarClienteController {
  constructor(private readonly editarCliente: EditarClienteUseCase) { }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('id') id: string,
    @Body() body: EditarClienteBodyDto
  ) {
    try {
      const { cliente } = await this.editarCliente.execute({
        id,
        ...body
      })
      return ClientePresenter.toHTTP(cliente)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}