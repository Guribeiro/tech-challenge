import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { DeletarClienteUseCase } from '../../application/use-cases/clientes/deletar-cliente.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
export class DeletarClienteController {
  constructor(private readonly deletarCliente: DeletarClienteUseCase) { }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar um cliente',
    description: 'Remove o cadastro de um cliente da base de dados pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) do cliente a ser deletado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Cliente removido com sucesso (sem conteúdo no corpo da resposta).',
  })
  @ApiNotFoundResponse({
    description: 'Cliente não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Cliente não encontrado(a).',
        error: 'RecursoNaoEncontradoError',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(@Param('id') id: string) {
    const result = await this.deletarCliente.execute({
      id,
    })

    unwrapEither(result)
  }
}