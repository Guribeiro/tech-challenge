import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { ObterFilaTrabalhoUseCase } from '../../application/use-cases/ordens-servicos/obter-fila-trabalho.js'
import { ObterFilaTrabalhoQueryDto } from '../../dto/ordem-servico/obter-fila-trabalho-query.dto.js'
import { OrdemServicoPresenter } from '../../presenters/ordem-servico-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { ObterFilaTrabalhoResponseDto } from '../../dto/ordem-servico/obter-fila-trabalho-response.dto.js'

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ordens-servicos')
export class ObterFilaTrabalhoController {
  constructor(private readonly obterFilaTrabalho: ObterFilaTrabalhoUseCase) { }

  @Get('fila-trabalho')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar fila de trabalho com paginação e filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de fila de trabalho retornada com sucesso.',
    type: ObterFilaTrabalhoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado ou erro na busca.',
  })
  async handle(@Query() query: ObterFilaTrabalhoQueryDto) {
    const result = await this.obterFilaTrabalho.execute({
      pagina: query.pagina,
      limite: query.limite,
      status: query.status,
    })

    const { ordensServicos, limite, pagina, total } = unwrapEither(result)

    return {
      fila: ordensServicos.map(OrdemServicoPresenter.toHTTP),
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    }
  }
}