import { Controller, Param, ParseUUIDPipe, Patch, UnauthorizedException, UseGuards } from '@nestjs/common'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'
import { FinalizarExecucaoUseCase } from '../../application/use-cases/ordens-servicos/finalizar-execucao.js'

@Controller('ordens-servicos')
@UseGuards(JwtAuthGuard)
export class FinalizarExecucaoController {
  constructor(
    private readonly finalizarExecucao: FinalizarExecucaoUseCase,
  ) { }

  @Patch(':ordemServicoId/finalizar-execucao')
  async handle(
    @Param('ordemServicoId', ParseUUIDPipe) ordemServicoId: string,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      await this.finalizarExecucao.execute({
        ordemServicoId,
        mecanicoId: user.sub,
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }

  }
}