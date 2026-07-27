// src/modules/faturamento/controllers/confirmar-pagamento.controller.ts
import {
  Controller,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Post,
  Body
} from '@nestjs/common'
import { ConfirmarPagamentoUseCase } from '../application/use-cases/confirmar-pagamento.js'
import { FaturaPresenter } from '../presenters/fatura-presenter.js'

interface WebhookPayload {
  event: 'payment.succeeded' | 'payment.failed'
  data: {
    faturaId: string
    transactionId: string
  }
}

@Controller('/webhooks/pagamentos')
export class ConfirmarPagamentoController {
  constructor(
    private readonly confirmarPagamento: ConfirmarPagamentoUseCase,
  ) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() body: WebhookPayload,
  ) {
    try {
      const { fatura } = await this.confirmarPagamento.execute({
        faturaId: body.data.faturaId,
      })

      return {
        fatura: FaturaPresenter.toHTTP(fatura),
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message)
      }

      throw error
    }
  }
}