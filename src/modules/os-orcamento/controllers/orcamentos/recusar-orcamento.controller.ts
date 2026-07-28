import { Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'
import { RecusarOrcamentoUseCase } from '../../application/use-cases/orcamento/recusar-orcamento.js'

@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class RecusarOrcamentoController {
  constructor(
    private readonly recusarOrcamento: RecusarOrcamentoUseCase,
  ) { }

  @Patch(':orcamentoId/recusar-orcamento')
  async handle(
    @Param('orcamentoId', ParseUUIDPipe) orcamentoId: string,
    @CurrentUser() user: UserPayload,
  ) {

    await this.recusarOrcamento.execute({
      orcamentoId,
      clienteId: user.sub,
    })
  }
}