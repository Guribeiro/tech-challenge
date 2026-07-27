import { Controller, Param, ParseUUIDPipe, Patch, UnauthorizedException, UseGuards } from '@nestjs/common'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'
import { IniciarExecucaoUseCase } from '../../application/use-cases/ordens-servicos/iniciar-execucao.js'

@Controller('ordens-servicos')
@UseGuards(JwtAuthGuard)
export class IniciarExecucaoController {
  constructor(
    private readonly iniciarExecucao: IniciarExecucaoUseCase,
  ) { }

  @Patch(':ordemServicoId/iniciar-execucao')
  async handle(
    @Param('ordemServicoId', ParseUUIDPipe) ordemServicoId: string,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      await this.iniciarExecucao.execute({
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