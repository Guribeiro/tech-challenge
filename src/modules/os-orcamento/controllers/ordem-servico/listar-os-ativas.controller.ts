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
import { OrdemServicoPresenter } from '../../presenters/ordem-servico-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { ListarOSAtivasQueryDto } from '../../dto/ordem-servico/listar-os-ativas-query.dto.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'
import { ListarOSAtivasUseCase } from '../../application/use-cases/ordens-servicos/listar-os-ativas.js'
import { ListarOSAtivasResponseDto } from '../../dto/ordem-servico/listar-os-ativas-response.dto.js'

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordens-servicos')
export class ListarOSAtivasController {
  constructor(private readonly listarOSAtivas: ListarOSAtivasUseCase) { }

  @Get('ativas')
  @Roles('ADMIN', 'MECANICO', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar ordens de serviço ativas com paginação e filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de ordens de serviço ativas retornada com sucesso.',
    type: ListarOSAtivasResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado ou erro na busca.',
  })
  async handle(@Query() query: ListarOSAtivasQueryDto) {
    const result = await this.listarOSAtivas.execute({
      pagina: query.pagina ? Number(query.pagina) : 1,
      limite: query.limite ? Number(query.limite) : 10,
    })

    const { ordensServicos, limite, pagina, total } = unwrapEither(result)

    return {
      ordensServicos: ordensServicos.map(OrdemServicoPresenter.toHTTP),
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    }
  }
}