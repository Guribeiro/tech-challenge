import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { CurrentUser } from '@/infra/auth/current-user.decorator.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { ListarNotificacoesDestinatarioUseCase } from '../application/use-cases/listar-notificacoes-destinatario.js'
import { ListarNotificacoesDestinatarioQueryDto } from '../dto/listar-notificacoes-destinatario-query.dto.js'
import { ListarNotificacoesDestinatarioResponseDto } from '../dto/listar-notificacoes-destinatario-response.dto.js'
import { NotificacaoResponseDto } from '../dto/notificacao-response.dto.js'

@ApiTags('Notificações')
@ApiBearerAuth()
@Controller('notificacoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListarNotificacoesDestinatarioController {
  constructor(
    private readonly listarNotificacoesDestinatario: ListarNotificacoesDestinatarioUseCase,
  ) { }

  @Get()
  @Roles('ADMIN', 'RECEPCAO', 'MECANICO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar notificações do destinatário autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificações retornadas com sucesso.',
    type: ListarNotificacoesDestinatarioResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(
    @Query() query: ListarNotificacoesDestinatarioQueryDto,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.listarNotificacoesDestinatario.execute({
      destinatarioId: user.sub,
      pagina: query.pagina ? Number(query.pagina) : 1,
      limite: query.limite ? Number(query.limite) : 10,
      status: query.status ?? 'nao_lidas',
    })

    const { notificacoes, total, pagina, limite } = unwrapEither(result)

    return {
      notificacoes: notificacoes.map((notificacao) => ({
        id: notificacao.getId().toValue(),
        titulo: notificacao.getTitulo(),
        conteudo: notificacao.getConteudo(),
        template: notificacao.getTemplate() ?? null,
        contexto: notificacao.getContexto() ?? null,
        lidaEm: notificacao.getLidaEm() ?? null,
        criadaEm: notificacao.getCriadaEm(),
      }) as NotificacaoResponseDto),
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    }
  }
}
