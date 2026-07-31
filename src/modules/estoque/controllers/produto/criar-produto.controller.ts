import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CriarProdutoUseCase } from '../../application/use-cases/criar-produto.js'
import { CriarProdutoBodyDto } from '../../dto/criar-produto-body.dto.js'
import { ProdutoResponseDto } from '../../dto/produto-response.dto.js'
import { ProdutoPresenter } from '../../presenters/produto-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('produtos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CriarProdutoController {
  constructor(private readonly criarProduto: CriarProdutoUseCase) { }

  @Post()
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar produto',
    description: 'Cadastra um novo produto (peça ou insumo) no estoque.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Produto cadastrado com sucesso.',
    type: ProdutoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um produto cadastrado com este código SKU ou nome.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Já existe um(a) Produto cadastrado(a) com este(a) código SKU: "SKU-88901".',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(@Body() body: CriarProdutoBodyDto) {
    const result = await this.criarProduto.execute(body)
    const { produto } = unwrapEither(result)

    return {
      produto: ProdutoPresenter.toHTTP(produto)
    }
  }
}