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
import { CurrentUser } from '../../../../infra/auth/current-user.decorator.js'
import { IniciarExecucaoUseCase } from '../../application/use-cases/ordens-servicos/iniciar-execucao.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordens-servicos')
export class IniciarExecucaoController {
  constructor(
    private readonly iniciarExecucao: IniciarExecucaoUseCase,
  ) { }

  @Patch(':ordemServicoId/iniciar-execucao')
  @Roles('MECANICO')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Iniciar execução da Ordem de Serviço',
    description:
      'Inicia a etapa de execução dos serviços da ordem de serviço. Ação restrita ao mecânico responsável ou gestores (ADMIN/RECEPCAO).',
  })
  @ApiParam({
    name: 'ordemServicoId',
    description: 'ID único (UUID) da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Execução inciada com sucesso.',
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
    description: 'Ordem de serviço ou Mecânico não encontrado.',
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
    const result = await this.iniciarExecucao.execute({
      ordemServicoId,
      mecanicoId: user.sub,
    })

    unwrapEither(result)
  }
}