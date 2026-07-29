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
import { IniciarDiagnosticoUseCase } from '../../application/use-cases/ordens-servicos/iniciar-diagnostico.js'
import type { UserPayload } from '@/infra/auth/jwt.strategy.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { CurrentUser } from '@/infra/auth/current-user.decorator.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ordens-servicos')
export class IniciarDiagnosticoController {
  constructor(
    private readonly iniciarDiagnostico: IniciarDiagnosticoUseCase,
  ) { }

  @Patch(':ordemServicoId/iniciar-diagnostico')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Iniciar diagnóstico de Ordem de Serviço',
    description:
      'Inicia a etapa de diagnóstico da ordem de serviço atribuindo o mecânico autenticado responsável.',
  })
  @ApiParam({
    name: 'ordemServicoId',
    description: 'ID único (UUID) da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Diagnóstico iniciado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ordem de Serviço, Mecânico ou Veículo não encontrado.',
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
    const result = await this.iniciarDiagnostico.execute({
      ordemServicoId,
      mecanicoId: user.sub,
    })

    unwrapEither(result)
  }
}