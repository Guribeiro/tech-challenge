import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CriarOrdemServicoUseCase } from '../../application/use-cases/ordens-servicos/criar-ordem-servico.js'
import { CriarOrdemServicoBodyDto } from '../../dto/ordem-servico/criar-ordem-servico-body.dto.js'
import { OrdemServicoPresenter } from '../../presenters/ordem-servico-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { OrdemServicoResponseDto } from '../../dto/ordem-servico/ordem-servico-response.dto.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordens-servicos')
export class CriarOrdemServicoController {
  constructor(private readonly criarOrdemServico: CriarOrdemServicoUseCase) { }

  @Post()
  @Roles('RECEPCAO')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir nova Ordem de Serviço',
    description:
      'Cria uma nova ordem de serviço associando cliente, veículo, serviços e componentes.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ordem de serviço criada com sucesso.',
    type: OrdemServicoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou estoque insuficiente para algum componente selecionado.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Estoque insuficiente para o produto "Filtro de Óleo Motul 5W30".',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente, veículo, produto ou serviço não encontrado.',
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
  async handle(@Body() body: CriarOrdemServicoBodyDto) {
    const result = await this.criarOrdemServico.execute(body)
    const { ordemServico } = unwrapEither(result)
    return OrdemServicoPresenter.toHTTP(ordemServico)
  }
}