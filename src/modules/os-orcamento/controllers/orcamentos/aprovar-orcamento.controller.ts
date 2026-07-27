import { Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'
import { AprovarOrcamentoUseCase } from '../../application/use-cases/orcamento/aprovar-orcamento.js'

@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class AprovarOrcamentoController {
  constructor(
    private readonly aprovarOrcamento: AprovarOrcamentoUseCase,
  ) { }

  @Patch(':orcamentoId/aprovar-orcamento')
  async handle(
    @Param('orcamentoId', ParseUUIDPipe) orcamentoId: string,
    @CurrentUser() user: UserPayload,
  ) {

    await this.aprovarOrcamento.execute({
      orcamentoId,
      clienteId: user.sub,
    })
  }
}