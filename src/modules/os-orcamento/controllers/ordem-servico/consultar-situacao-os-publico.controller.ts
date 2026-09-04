import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common'
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ConsultarSituacaoOSPublicoUseCase } from '../../application/use-cases/ordens-servicos/consultar-situacao-os-publico.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { OrdemServicoRastreioPresenter } from '../../presenters/ordem-servico-rastreio-presenter.js'

@ApiTags('Ordens de Serviço - Público')
@Controller('/ordens-servicos/rastreio')
export class ConsultarSituacaoOSPublicoController {
  constructor(
    private readonly consultarSituacaoOSPublico: ConsultarSituacaoOSPublicoUseCase,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar situação de Ordem de Serviço publicamente',
    description:
      'Permite que o cliente consulte o status atual e informações essenciais da sua ordem de serviço informando a placa do veículo e o documento (CPF/CNPJ).',
  })
  @ApiQuery({
    name: 'placa',
    description: 'Placa do veículo cadastrado na ordem de serviço',
    example: 'ABC1234',
    required: true,
  })
  @ApiQuery({
    name: 'documento',
    description: 'Documento (CPF ou CNPJ) do cliente associado',
    example: '12345678909',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Situação da ordem de serviço retornada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos ou ausentes.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente, veículo ou ordem de serviço não encontrados.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Recurso não encontrado.',
        error: 'Not Found',
      },
    },
  })
  async handle(
    @Query('placa') placa: string,
    @Query('documento') documento: string,
  ) {
    const result = await this.consultarSituacaoOSPublico.execute({
      placa,
      documento,
    })

    const { ordemServico } = unwrapEither(result)

    return OrdemServicoRastreioPresenter.toHTTP(ordemServico)
  }
}