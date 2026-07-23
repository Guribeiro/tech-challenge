import { Controller, Get, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common'
import { ListarVeiculosUseCase } from '../../application/use-cases/veiculos/listar-veiculos.js'
import { VeiculoPresenter } from '../../presenters/veiculo-presenter.js'
import { ListarClientesQueryDto } from '../../dto/listar-veiculos-query.dto.js'

@Controller('veiculos')
export class ListarVeiculosController {
  constructor(private readonly listarVeiculos: ListarVeiculosUseCase) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async handle(@Query() query: ListarClientesQueryDto) {
    try {
      const output = await this.listarVeiculos.execute({
        pagina: query.pagina,
        limite: query.limite,
        status: query.status,
      })

      return {
        veiculos: output.veiculos.map(VeiculoPresenter.toHTTP),
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