import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { CriarClienteUseCase } from '../../application/use-cases/clientes/criar-cliente.js'
import { CriarClienteBodyDto } from '../../dto/criar-cliente.dto.js'
import { ClientePresenter } from '../../presenters/cliente-presenter.js'

@Controller('clientes')
export class CriarClienteController {
  constructor(private readonly criarCliente: CriarClienteUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: CriarClienteBodyDto) {
    try {
      const { cliente } = await this.criarCliente.execute(body)
      return ClientePresenter.toHTTP(cliente)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}