import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { EditarServicoUseCase } from '../../application/use-cases/servicos/editar-servico.js'
import { ServicoPresenter } from '../../presenters/servico-presenter.js'
import { EditarServicoBodyDto } from '../../dto/servico/editar-servico-body.dto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import { ServicoResponseDto } from '../../dto/servico/servico-response.dto.js'
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('servicos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EditarServicoController {
  constructor(private readonly editarServico: EditarServicoUseCase) { }

  @Put(':id')
  @Roles('ADMIN', 'RECEPCAO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Editar serviço',
    description: 'Atualiza os dados de um serviço existente pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) do serviço a ser editado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Serviço atualizado com sucesso.',
    type: ServicoResponseDto,
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
    status: HttpStatus.CONFLICT,
    description: 'Já existe um serviço cadastrado com este nome.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Já existe um serviço cadastrado com o nome "Troca de Óleo".',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação ausente ou inválido.',
  })
  async handle(
    @Param('id') id: string,
    @Body() body: EditarServicoBodyDto
  ) {
    const result = await this.editarServico.execute({
      id,
      ...body
    })

    const { servico } = unwrapEither(result)
    return ServicoPresenter.toHTTP(servico)
  }
}