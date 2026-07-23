import { Controller, Get, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common'
import { ListarClientesUseCase } from '../../application/use-cases/clientes/listar-clientes.js'
import { ClientePresenter } from '../../presenters/cliente-presenter.js'
import { ListarClientesQueryDto } from '../../dto/listar-clientes-query.dto.js'

@Controller('clientes')
export class ListarClientesController {
  constructor(private readonly listarClientes: ListarClientesUseCase) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async handle(@Query() query: ListarClientesQueryDto) {
    try {
      const output = await this.listarClientes.execute({
        pagina: query.pagina,
        limite: query.limite,
        status: query.status,
        nome: query.nome,
      })

      return {
        clientes: output.clientes.map(ClientePresenter.toHTTP),
        meta: {
          total: output.total,
          pagina: output.pagina,
          limite: output.limite,
          totalPaginas: Math.ceil(output.total / output.limite),
        },
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}