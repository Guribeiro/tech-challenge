// src/infra/http/controllers/produtos/desativar-produto.controller.ts
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { DesativarProdutoUseCase } from '../../application/use-cases/desativar-produto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('produtos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesativarProdutoController {
  constructor(private readonly desativarProduto: DesativarProdutoUseCase) { }

  @Delete(':id')
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desativar produto',
    description: 'Realiza a inativação/desativação lógica de um produto no estoque pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) do produto a ser desativado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto desativado com sucesso.',
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
  async handle(@Param('id') id: string) {
    const result = await this.desativarProduto.execute({
      produtoId: id,
    })

    unwrapEither(result)
  }
}