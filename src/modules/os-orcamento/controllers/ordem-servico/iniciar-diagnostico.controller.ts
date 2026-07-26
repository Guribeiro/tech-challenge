import { Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { IniciarDiagnosticoUseCase } from '../../application/use-cases/ordens-servicos/iniciar-diagnostico.js'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'

@Controller('ordens-servicos')
@UseGuards(JwtAuthGuard)
export class IniciarDiagnosticoController {
  constructor(
    private readonly iniciarDiagnostico: IniciarDiagnosticoUseCase,
  ) { }

  @Patch(':ordemServicoId/iniciar-diagnostico')
  async handle(
    @Param('ordemServicoId', ParseUUIDPipe) ordemServicoId: string,
    @CurrentUser() user: UserPayload,
  ) {

    await this.iniciarDiagnostico.execute({
      ordemServicoId,
      mecanicoId: user.sub,
    })
  }
}