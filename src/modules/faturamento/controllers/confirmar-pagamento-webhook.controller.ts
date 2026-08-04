// src/modules/faturamento/controllers/confirmar-pagamento.controller.ts
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body
} from '@nestjs/common'
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ConfirmarPagamentoUseCase } from '../application/use-cases/confirmar-pagamento.js'
import { FaturaPresenter } from '../presenters/fatura-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { WebhookPayloadDto } from '../dto/webhook-payload.dto.js'

@ApiTags('Webhooks')
@Controller('/webhooks/pagamentos')
export class ConfirmarPagamentoController {
  constructor(
    private readonly confirmarPagamento: ConfirmarPagamentoUseCase,
  ) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de confirmação de pagamento',
    description:
      'Recebe eventos do gateway de pagamento para atualizar o status e processar a liquidação da fatura. A operação é idempotente.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pagamento confirmado e fatura processada com sucesso.',
    schema: {
      example: {
        fatura: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          orcamentoId: '987e6543-e21b-12d3-a456-426614174000',
          valorTotal: 45050,
          status: 'PAGA',
          emitidaEm: '2026-07-28T10:00:00.000Z',
          pagaEm: '2026-07-29T15:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Estrutura do payload enviada pelo gateway é inválida.',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'data.faturaId deve ser um UUID válido',
          'event deve ser um dos seguintes valores: payment.succeeded, payment.failed',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Fatura referenciada no evento não foi encontrada no banco de dados.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Fatura com ID 123e4567-e89b-12d3-a456-426614174000 não encontrado(a).',
        error: 'Not Found',
      },
    },
  })
  async handle(
    @Body() body: WebhookPayloadDto,
  ) {
    const result = await this.confirmarPagamento.execute({
      faturaId: body.data.faturaId,
    })
    const { fatura } = unwrapEither(result)

    return {
      fatura: FaturaPresenter.toHTTP(fatura),
    }
  }
}