import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ListarClientesUseCase } from '../../application/use-cases/clientes/listar-clientes.js'
import { ListarClientesQueryDto } from '../../dto/cliente/listar-clientes-query.dto.js'
import { ListarClientesResponseDto } from '../../dto/cliente/listar-clientes-response.dto.js'
import { ClientePresenter } from '../../presenters/cliente-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'


@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListarClientesController {
  constructor(private readonly listarClientes: ListarClientesUseCase) { }

  @Get()
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar clientes com paginação e filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de clientes retornada com sucesso.',
    type: ListarClientesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado ou erro na busca.',
  })
  async handle(@Query() query: ListarClientesQueryDto) {
    const result = await this.listarClientes.execute({
      pagina: query.pagina ? Number(query.pagina) : 1,
      limite: query.limite ? Number(query.limite) : 10,
      status: query.status,
      nome: query.nome,
    })

    const {
      clientes,
      limite,
      pagina,
      total
    } = unwrapEither(result)

    return {
      clientes: clientes.map(ClientePresenter.toHTTP),
      meta: {
        total: total,
        pagina: pagina,
        limite: limite,
        totalPaginas: Math.ceil(total / limite),
      },
    }
  }
}