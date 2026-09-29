import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common'
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { ProcessarDecisaoOrcamentoUseCase } from '../../application/use-cases/orcamento/processar-decisao-orcamento.js'
import { ProcessarDecisaoOrcamentoBodyDTO } from '../../dto/orcamento/processar-decisao-orcamento-body.dto.js'

@ApiTags('Orçamentos')
@Controller('orcamentos')
export class ProcessarDecisaoOrcamentoController {
  constructor(
    private readonly processarDecisaoOrcamento: ProcessarDecisaoOrcamentoUseCase,
  ) { }

  @Patch('decisoes/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Processar decisão de orçamento via token',
    description:
      'Permite que o cliente aprove ou recuse um orçamento de forma segura utilizando o token enviado por e-mail.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de segurança enviado por e-mail',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Decisão processada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Token inválido ou orçamento não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Recurso não encontrado.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Token expirado ou já utilizado.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Ação não permitida.',
        error: 'Forbidden',
      },
    },
  })
  async handle(
    @Param('token') token: string,
    @Body() body: ProcessarDecisaoOrcamentoBodyDTO,
  ) {
    const { decisao, motivoRecusa } = body

    const result = await this.processarDecisaoOrcamento.execute({
      token,
      decisao,
      motivoRecusa,
    })

    unwrapEither(result)
  }
}