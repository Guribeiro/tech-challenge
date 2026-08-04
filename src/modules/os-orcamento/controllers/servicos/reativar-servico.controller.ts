import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ReativarServicoUseCase } from '../../application/use-cases/servicos/reativar-servico.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('servicos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReativarServicoController {
  constructor(private readonly reativarServico: ReativarServicoUseCase) { }

  @Patch(':id/reativar')
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reativar serviço',
    description: 'Realiza a reativação lógica de um serviço cadastrado pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) do serviço a ser reativado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Serviço reativado com sucesso.',
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
    const result = await this.reativarServico.execute({
      servicoId: id
    })
    unwrapEither(result)
  }
}