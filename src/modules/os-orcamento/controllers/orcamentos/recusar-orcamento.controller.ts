import {
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
import { RecusarOrcamentoUseCase } from '../../application/use-cases/orcamento/recusar-orcamento.js'

@ApiTags('Orçamentos')
@ApiBearerAuth()
@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class RecusarOrcamentoController {
  constructor(
    private readonly recusarOrcamento: RecusarOrcamentoUseCase,
  ) { }

  @Patch(':orcamentoId/recusar-orcamento')
  @ApiOperation({
    summary: 'Recusar orçamento',
    description:
      'Realiza a recusa de um orçamento pendente pelo cliente autenticado.',
  })
  @ApiParam({
    name: 'orcamentoId',
    description: 'ID único (UUID) do orçamento a ser recusado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Orçamento recusado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'O usuário autenticado não tem permissão para recusar este orçamento.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Você não tem permissão para recusar este orçamento.',
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
  ) {

    await this.recusarOrcamento.execute({
      orcamentoId,
      clienteId: user.sub,
    })
  }
}