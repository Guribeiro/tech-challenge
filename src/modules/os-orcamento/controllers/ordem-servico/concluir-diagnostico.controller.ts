import { Body, Controller, Param, ParseUUIDPipe, Patch, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ConcluirDiagnosticoUseCase } from '../../application/use-cases/ordens-servicos/concluir-diagnostico.js'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'
import { ConcluirDiagnosticoBodyDto } from '../../dto/concluir-diagnostico-body.dto.js'

@Controller('ordens-servicos')
@UseGuards(JwtAuthGuard)
export class ConcluirDiagnosticoController {
  constructor(
    private readonly concluirDiagnostico: ConcluirDiagnosticoUseCase,
  ) { }

  @Patch(':ordemServicoId/concluir-diagnostico')
  async handle(
    @Param('ordemServicoId', ParseUUIDPipe) ordemServicoId: string,
    @CurrentUser() user: UserPayload,
    @Body() body: ConcluirDiagnosticoBodyDto
  ) {
    try {
      await this.concluirDiagnostico.execute({
        ordemServicoId,
        usuarioId: user.sub,
        usuarioRole: user.role,
        componentes: body.componentes,
        servicos: body.servicos,
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}