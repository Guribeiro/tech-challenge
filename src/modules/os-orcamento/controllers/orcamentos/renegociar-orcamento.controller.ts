import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'
import { RenegociarOrcamentoUseCase } from '../../application/use-cases/orcamento/renegociar-orcamento.js'
import { RenegocicarOrcamentoBodyDto } from '../../dto/renegociar-orcamento-body.dto.js'

@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class RenegociarOrcamentoController {
  constructor(
    private readonly renegociarOrcamento: RenegociarOrcamentoUseCase,
  ) { }

  @Patch(':orcamentoId/renegociar-orcamento')
  async handle(
    @Param('orcamentoId', ParseUUIDPipe) orcamentoId: string,
    @CurrentUser() user: UserPayload,
    @Body() body: RenegocicarOrcamentoBodyDto
  ) {

    await this.renegociarOrcamento.execute({
      orcamentoId,
      componentes: body.componentes,
      servicos: body.servicos,
      descontoPorcentagem: body.descontoPorcentagem,
      usuarioId: user.sub,
    })
  }
}