import { Body, Controller, HttpCode, HttpStatus, Param, Post, Put, UnauthorizedException } from '@nestjs/common'
import { EditarVeiculoUseCase } from '../../application/use-cases/veiculos/editar-veiculo.js'
import { EditarVeiculoBodyDto } from '../../dto/editar-veiculo.dto.js'
import { VeiculoPresenter } from '../../presenters/veiculo-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { VeiculoResponseDto } from '../../dto/veiculo/veiculo-response.dto.js'

@ApiTags('Veículos')
@ApiBearerAuth()
@Controller('veiculos')
export class EditarVeiculoController {
  constructor(private readonly editarVeiculo: EditarVeiculoUseCase) { }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar um veículo' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) do veículo a ser atualizado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo atualizado com sucesso.',
    type: VeiculoResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo não localizado na base de dados.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Veículo não encontrado(a).',
        error: 'RecursoNaoEncontradoError',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos (falha de validação no DTO).',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(
    @Param('id') id: string,
    @Body() body: EditarVeiculoBodyDto
  ) {
    const result = await this.editarVeiculo.execute({
      id,
      ...body
    })
    const { veiculo } = unwrapEither(result)
    return VeiculoPresenter.toHTTP(veiculo)
  }
}