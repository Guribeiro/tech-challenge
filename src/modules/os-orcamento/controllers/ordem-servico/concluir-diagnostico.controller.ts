import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ConcluirDiagnosticoUseCase } from '../../application/use-cases/ordens-servicos/concluir-diagnostico.js'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '@/infra/auth/current-user.decorator.js'
import { ConcluirDiagnosticoBodyDto } from '../../dto/ordem-servico/concluir-diagnostico-body.dto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ordens-servicos')
@UseGuards(JwtAuthGuard)
export class ConcluirDiagnosticoController {
  constructor(
    private readonly concluirDiagnostico: ConcluirDiagnosticoUseCase,
  ) { }

  @Patch(':ordemServicoId/concluir-diagnostico')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Concluir diagnóstico de Ordem de Serviço',
    description:
      'Finaliza a etapa de diagnóstico, associando os serviços e componentes apurados pelo mecânico à ordem de serviço.',
  })
  @ApiParam({
    name: 'ordemServicoId',
    description: 'ID único (UUID) da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Diagnóstico concluído com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permissão negada. Apenas o mecânico responsável que iniciou o diagnóstico ou gestores (ADMIN/RECEPCAO) podem conclui-lo.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Apenas o mecânico responsável que iniciou o diagnóstico (ou um gestor) pode concluí-lo.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos ou regras de negócio violadas.',
    schema: {
      example: {
        statusCode: 400,
        message: 'A ordem de serviço não está na etapa de diagnóstico.',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ordem de serviço, serviço ou produto não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Recurso não encontrado.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(
    @Param('ordemServicoId', ParseUUIDPipe) ordemServicoId: string,
    @CurrentUser() user: UserPayload,
    @Body() body: ConcluirDiagnosticoBodyDto
  ) {
    const result = await this.concluirDiagnostico.execute({
      ordemServicoId,
      usuarioId: user.sub,
      componentes: body.componentes,
      servicos: body.servicos,
    })

    unwrapEither(result)
  }
}