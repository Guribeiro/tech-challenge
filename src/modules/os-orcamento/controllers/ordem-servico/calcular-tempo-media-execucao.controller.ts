import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js';
import { Roles } from '@/infra/auth/roles.decorator.js';
import { RolesGuard } from '@/infra/auth/roles.guard.js';
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js';
import { CalcularTempoMediaExecucaoServicosUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/calcular-tempo-media-execucao.js';
import { CalcularTempoMedioQueryDto } from '@/modules/os-orcamento/dto/ordem-servico/calcular-tempo-media-execucao-query.dto.js';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Ordens de Serviço - Métricas')
@Controller('ordens-servicos/metricas/tempo-medio')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalcularTempoMedioExecucaoServicosController {
  constructor(
    private readonly calcularTempoMedioUseCase: CalcularTempoMediaExecucaoServicosUseCase,
  ) { }

  @Get()
  @Roles('RECEPCAO', 'ADMIN')
  @ApiOperation({
    summary: 'Calcular tempo médio de execução das ordens de serviço',
    description: 'Retorna o tempo médio em minutos e a quantidade de serviços concluídos, permitindo filtragem opcional por período de data de finalização.'
  })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    type: String,
    description: 'Data inicial para o filtro de finalização (Formato ISO 8601, ex: 2026-01-01T00:00:00.000Z)'
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    type: String,
    description: 'Data final para o filtro de finalização (Formato ISO 8601, ex: 2026-31-01T23:59:59.999Z)'
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas calculadas com sucesso.',
    schema: {
      example: {
        metricas: {
          tempoMedioMinutos: 125.5,
          totalServicosConcluidos: 42
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  public async handle(@Query() query: CalcularTempoMedioQueryDto) {
    const { dataInicio, dataFim } = query;
    const result = await this.calcularTempoMedioUseCase.execute({
      dataInicio,
      dataFim,
    });

    const { tempoMedioMinutos, totalServicosConcluidos } = unwrapEither(result)

    return {
      metricas: {
        tempoMedioMinutos,
        totalServicosConcluidos,
      },
    };
  }
}