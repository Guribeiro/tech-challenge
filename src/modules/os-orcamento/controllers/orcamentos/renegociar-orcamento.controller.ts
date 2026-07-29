import {
  Body,
  Controller,
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
import { RenegociarOrcamentoUseCase } from '../../application/use-cases/orcamento/renegociar-orcamento.js'
import { RenegocicarOrcamentoBodyDto } from '../../dto/renegociar-orcamento-body.dto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'

@ApiTags('Orçamentos')
@ApiBearerAuth()
@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class RenegociarOrcamentoController {
  constructor(
    private readonly renegociarOrcamento: RenegociarOrcamentoUseCase,
  ) { }

  @Patch(':orcamentoId/renegociar-orcamento')
  @ApiOperation({
    summary: 'Renegociar orçamento',
    description:
      'Realiza a renegociação de um orçamento renegociado pelo cliente',
  })
  @ApiParam({
    name: 'orcamentoId',
    description: 'ID único (UUID) do orçamento a ser renegociado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Orçamento renegociado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'O usuário autenticado não tem permissão para renegociar este orçamento.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Você não tem permissão para renegociar este orçamento.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orçamento não encontrado.',
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
    @Param('orcamentoId', ParseUUIDPipe) orcamentoId: string,
    @CurrentUser() user: UserPayload,
    @Body() body: RenegocicarOrcamentoBodyDto
  ) {

    const result = await this.renegociarOrcamento.execute({
      orcamentoId,
      componentes: body.componentes,
      servicos: body.servicos,
      descontoPorcentagem: body.descontoPorcentagem,
      usuarioId: user.sub,
    })
    unwrapEither(result)
  }
}