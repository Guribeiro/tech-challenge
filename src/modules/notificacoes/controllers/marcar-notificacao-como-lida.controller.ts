import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { CurrentUser } from '@/infra/auth/current-user.decorator.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { MarcarNotificacaoComoLidaUseCase } from '../application/use-cases/marcar-notificacao-como-lida.js'

@ApiTags('Notificações')
@ApiBearerAuth()
@Controller('notificacoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarcarNotificacaoComoLidaController {
  constructor(
    private readonly marcarNotificacaoComoLidaUseCase: MarcarNotificacaoComoLidaUseCase,
  ) { }

  @Patch(':notificacaoId/marcar-como-lida')
  @Roles('ADMIN', 'RECEPCAO', 'MECANICO')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiParam({
    name: 'notificacaoId',
    description: 'ID único da notificação a ser marcada como lida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Notificação marcada como lida com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notificação não encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário autenticado não tem permissão para marcar esta notificação.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(
    @Param('notificacaoId', ParseUUIDPipe) notificacaoId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.marcarNotificacaoComoLidaUseCase.execute({
      notificacaoId,
      destinatarioId: user.sub,
    })

    unwrapEither(result)
  }
}
