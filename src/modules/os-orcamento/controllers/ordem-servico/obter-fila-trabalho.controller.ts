import { Controller, Get, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common'
import { ObterFilaTrabalhoUseCase } from '../../application/use-cases/ordens-servicos/obter-fila-trabalho.js'
import { ObterFilaTrabalhoQueryDto } from '../../dto/obter-fila-trabalho-query.dto.js'
import { OrdemServicoPresenter } from '../../presenters/ordem-servico-presenter.js'

@Controller('ordens-servicos/fila-trabalho')
export class ObterFilaTrabalhoController {
  constructor(private readonly obterFilaTrabalho: ObterFilaTrabalhoUseCase) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async handle(@Query() query: ObterFilaTrabalhoQueryDto) {
    try {
      const output = await this.obterFilaTrabalho.execute({
        pagina: query.pagina,
        limite: query.limite,
        status: query.status,
      })

      return {
        fila: output.ordensServicos.map(OrdemServicoPresenter.toHTTP),
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