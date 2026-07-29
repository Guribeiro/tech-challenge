import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ReativarProdutoUseCase } from '../../application/use-cases/reativar-produto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'


@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('produtos')
export class ReativarProdutoController {
  constructor(private readonly reativar: ReativarProdutoUseCase) { }

  @Patch(':id/reativar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reativar produto',
    description: 'Realiza a reativação lógica de um produto no estoque pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) do produto a ser reativado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto reativado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado.',
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
    const result = await this.reativar.execute({
      produtoId: id
    })
    unwrapEither(result)
  }
}