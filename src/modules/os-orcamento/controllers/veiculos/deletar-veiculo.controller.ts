import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards
} from '@nestjs/common'
import { DeletarVeiculoUseCase } from '../../application/use-cases/veiculos/deletar-veiculo.js'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Veículos')
@ApiBearerAuth()
@Controller('veiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeletarVeiculoController {
  constructor(private readonly deletarVeiculo: DeletarVeiculoUseCase) { }

  @Delete(':id')
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deletar um veículo',
    description: 'Remove o cadastro de um veículo da base de dados pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) do veículo a ser deletado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Veículo removido com sucesso (sem conteúdo no corpo da resposta).',
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Veículo não encontrado(a).',
        error: 'RecursoNaoEncontradoError',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(@Param('id') id: string) {
    const result = await this.deletarVeiculo.execute({
      id
    })

    unwrapEither(result)
  }
}