import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { CriarMecanicoUseCase } from '../../application/use-cases/mecanicos/criar-mecanico.js'
import { CriarMecanicoBodyDto } from '../../dto/mecanico/criar-mecanico.dto.js'
import { CriarMecanicoResponseDto } from '../../dto/mecanico/mecanico-response.dto.js'
import { MecanicoPresenter } from '../../presenters/mecanico-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'

@ApiTags('Mecânicos')
@ApiBearerAuth()
@Controller('mecanicos')
export class CriarMecanicoController {
  constructor(private readonly criarMecanico: CriarMecanicoUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cadastrar novo mecânico',
    description: 'Cadastra um novo mecânico na oficina garantindo que e-mail e CPF sejam únicos.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mecânico cadastrado com sucesso.',
    type: CriarMecanicoResponseDto,
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
  async handle(@Body() body: CriarMecanicoBodyDto) {
    const result = await this.criarMecanico.execute(body)
    const { mecanico } = unwrapEither(result)

    return {
      mecanico: MecanicoPresenter.toHTTP(mecanico)
    }
  }
}