import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards
} from '@nestjs/common'
import { EditarClienteUseCase } from '../../application/use-cases/clientes/editar-cliente.js'
import { EditarClienteBodyDto } from '../../dto/cliente/editar-cliente.dto.js'
import { ClientePresenter } from '../../presenters/cliente-presenter.js'
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
import { ClienteResponseDto } from '../../dto/cliente/cliente-response.dto.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EditarClienteController {
  constructor(private readonly editarCliente: EditarClienteUseCase) { }

  @Put(':id')
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar um cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) do cliente a ser atualizado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente atualizado com sucesso.',
    type: ClienteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cliente não localizado na base de dados.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Cliente não encontrado(a).',
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
    @Body() body: EditarClienteBodyDto
  ) {
    const result = await this.editarCliente.execute({
      id,
      ...body
    })
    const { cliente } = unwrapEither(result)
    return ClientePresenter.toHTTP(cliente)
  }
}