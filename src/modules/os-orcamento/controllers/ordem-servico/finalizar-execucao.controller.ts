import {
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
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '@/infra/auth/current-user.decorator.js'
import { FinalizarExecucaoUseCase } from '../../application/use-cases/ordens-servicos/finalizar-execucao.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordens-servicos')
export class FinalizarExecucaoController {
  constructor(
    private readonly finalizarExecucao: FinalizarExecucaoUseCase,
  ) { }

  @Patch(':ordemServicoId/finalizar-execucao')
  @Roles('MECANICO')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Finalizar execução da Ordem de Serviço',
    description:
      'Conclui a etapa de execução dos serviços da ordem de serviço. Ação restrita ao mecânico responsável ou gestores (ADMIN/RECEPCAO).',
  })
  @ApiParam({
    name: 'ordemServicoId',
    description: 'ID único (UUID) da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Execução finalizada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permissão negada. Apenas o mecânico responsável que iniciou o diagnóstico ou gestores (ADMIN/RECEPCAO) podem finalizar a execução.',
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
  ) {
    const result = await this.finalizarExecucao.execute({
      ordemServicoId,
      mecanicoId: user.sub,
    })
    unwrapEither(result)
  }
}