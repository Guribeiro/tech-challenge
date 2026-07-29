import { Controller, Get, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common'
import { ListarServicosUseCase } from '../../application/use-cases/servicos/listar-servicos.js'
import { ServicoPresenter } from '../../presenters/servico-presenter.js'
import { ListarServicosQueryDto } from '../../dto/servico/listar-servicos-query.dto.js'

@Controller('servicos')
export class ListarServicosController {
  constructor(private readonly listarServicos: ListarServicosUseCase) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async handle(@Query() query: ListarServicosQueryDto) {
    try {
      const output = await this.listarServicos.execute({
        pagina: query.pagina,
        limite: query.limite,
        status: query.status,
        nome: query.nome,
      })

      return {
        servicos: output.servicos.map(ServicoPresenter.toHTTP),
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