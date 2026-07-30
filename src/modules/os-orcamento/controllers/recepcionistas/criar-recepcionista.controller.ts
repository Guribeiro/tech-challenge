import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { CriarRecepcionistaUseCase } from '../../application/use-cases/recepcionistas/criar-recepcionista.js'
import { CriarRecepcionistaBodyDto } from '../../dto/recepcionista/criar-recepcionista.dto.js'
import { CriarRecepcionistaResponseDto } from '../../dto/recepcionista/recepcionista-response.dto.js'
import { RecepcionistaPresenter } from '../../presenters/recepcionista-presenter.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'

@ApiTags('Recepcionistas')
@ApiBearerAuth()
@Controller('recepcionistas')
export class CriarRecepcionistaController {
  constructor(private readonly criarRecepcionista: CriarRecepcionistaUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cadastrar novo recepcionista',
    description: 'Cadastra um novo recepcionista na oficina garantindo que e-mail e CPF sejam únicos.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recepcionista cadastrado com sucesso.',
    type: CriarRecepcionistaResponseDto,
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
  async handle(@Body() body: CriarRecepcionistaBodyDto) {
    const result = await this.criarRecepcionista.execute(body)
    const { recepcionista } = unwrapEither(result)

    return {
      recepcionista: RecepcionistaPresenter.toHTTP(recepcionista)
    }
  }
}