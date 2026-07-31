import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { CriarVeiculoUseCase } from '../../application/use-cases/veiculos/criar-veiculo.js'
import { CriarVeiculoBodyDto } from '../../dto/veiculo/criar-veiculo.dto.js'
import { VeiculoResponseDto } from '../../dto/veiculo/veiculo-response.dto.js'
import { VeiculoPresenter } from '../../presenters/veiculo-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Veículos')
@ApiBearerAuth()
@Controller('veiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CriarVeiculoController {
  constructor(private readonly criarVeiculo: CriarVeiculoUseCase) { }

  @Post()
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar novo veículo',
    description: 'Cadastra um novo veículo vinculando-o a um cliente existente.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Veículo cadastrado com sucesso.',
    type: VeiculoResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cliente proprietário não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Cliente não encontrado(a).',
        error: 'RecursoNaoEncontradoError',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Placa já cadastrada no sistema.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Esta Placa já está cadastrada',
        error: 'PlacaJaCadastradaError',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Erro de validação nos dados fornecidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(@Body() body: CriarVeiculoBodyDto) {
    const result = await this.criarVeiculo.execute(body)
    const { veiculo } = unwrapEither(result)

    return {
      veiculo: VeiculoPresenter.toHTTP(veiculo)
    }
  }
}