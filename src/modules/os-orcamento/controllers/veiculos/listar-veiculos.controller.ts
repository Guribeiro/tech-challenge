import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ListarVeiculosUseCase } from '../../application/use-cases/veiculos/listar-veiculos.js'
import { ListarClientesQueryDto } from '../../dto/veiculo/listar-veiculos-query.dto.js'
import { ListarVeiculosResponseDto } from '../../dto/veiculo/listar-veiculos-response.dto.js'
import { VeiculoPresenter } from '../../presenters/veiculo-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Veículos')
@ApiBearerAuth()
@Controller('veiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListarVeiculosController {
  constructor(private readonly listarVeiculos: ListarVeiculosUseCase) { }

  @Get()
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar veículos com paginação e filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de veículos retornada com sucesso.',
    type: ListarVeiculosResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado ou erro na busca.',
  })
  async handle(@Query() query: ListarClientesQueryDto) {
    const result = await this.listarVeiculos.execute({
      pagina: query.pagina ? Number(query.pagina) : 1,
      limite: query.limite ? Number(query.limite) : 10,
      status: query.status,
    })

    const { veiculos, limite, pagina, total } = unwrapEither(result)

    return {
      veiculos: veiculos.map(VeiculoPresenter.toHTTP),
      meta: {
        total: total,
        pagina: pagina,
        limite: limite,
        totalPaginas: Math.ceil(total / limite),
      },
    }
  }
}