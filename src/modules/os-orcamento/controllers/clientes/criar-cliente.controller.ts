import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException, UseGuards } from '@nestjs/common'
import { CriarClienteUseCase } from '../../application/use-cases/clientes/criar-cliente.js'
import { CriarClienteBodyDto } from '../../dto/cliente/criar-cliente.dto.js'
import { ClientePresenter } from '../../presenters/cliente-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { CriarClienteResponseDto } from '../../dto/cliente/criar-cliente-response.dto.js'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CriarClienteController {
  constructor(private readonly criarCliente: CriarClienteUseCase) { }

  @Post()
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cadastrar um novo cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente criado com sucesso.',
    type: CriarClienteResponseDto,
  })
  @ApiConflictResponse({
    description: 'E-mail ou CPF já cadastrado no sistema.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Este e-mail já está cadastrado.',
        error: 'EmailJaCadastradoError',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Erro de validação nos dados fornecidos.',
    schema: {
      example: {
        statusCode: 400,
        message: ['email deve ser um e-mail válido', 'cpf não pode ser vazio'],
        error: 'Bad Request',
      },
    },
  })
  async handle(@Body() body: CriarClienteBodyDto) {
    const result = await this.criarCliente.execute(body)
    const { cliente } = unwrapEither(result)
    return {
      cliente: ClientePresenter.toHTTP(cliente)
    }
  }
}