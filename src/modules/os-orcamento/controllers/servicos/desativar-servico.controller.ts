import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { DesativarServicoUseCase } from '../../application/use-cases/servicos/desativar-servico.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('servicos')
export class DesativarServicoController {
  constructor(private readonly desativarServico: DesativarServicoUseCase) { }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desativar serviço',
    description: 'Realiza a desativação lógica de um serviço cadastrado pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) do serviço a ser desativado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Serviço desativado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Serviço não encontrado.',
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
  async handle(@Param('id') id: string,) {
    const result = await this.desativarServico.execute({
      servicoId: id
    })

    unwrapEither(result)
  }
}