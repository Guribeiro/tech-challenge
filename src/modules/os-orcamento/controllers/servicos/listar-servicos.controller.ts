import {
  Controller, Get, HttpCode, HttpStatus, Query,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ListarServicosUseCase } from '../../application/use-cases/servicos/listar-servicos.js'
import { ServicoPresenter } from '../../presenters/servico-presenter.js'
import { ListarServicosQueryDto } from '../../dto/servico/listar-servicos-query.dto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { ListarServicosResponseDto } from '../../dto/servico/listar-servicos-response.dto.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('servicos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListarServicosController {
  constructor(private readonly listarServicos: ListarServicosUseCase) { }

  @Get()
  @Roles('ADMIN', 'RECEPCAO', 'MECANICO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar serviços com paginação e filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de serviços retornada com sucesso.',
    type: ListarServicosResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado ou erro na busca.',
  })
  async handle(@Query() query: ListarServicosQueryDto) {
    const result = await this.listarServicos.execute({
      pagina: query.pagina,
      limite: query.limite,
      status: query.status,
      nome: query.nome,
    })

    const { servicos, limite, pagina, total } = unwrapEither(result)

    return {
      servicos: servicos.map(ServicoPresenter.toHTTP),
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    }
  }
}