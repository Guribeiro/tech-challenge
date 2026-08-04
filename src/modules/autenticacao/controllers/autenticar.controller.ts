import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AutenticarUseCase } from '../application/use-cases/autenticar.js'
import { AutenticarBodyDto } from '../dto/autenticar.dto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger'
import { AutenticarResponseDto } from '../dto/autenticar-response.dto.js'

@ApiTags('Autenticação')
@Controller('sessions')
export class AutenticarController {
  constructor(private readonly autenticarUseCase: AutenticarUseCase) { }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário',
    description: 'Realiza a autenticação via e-mail e senha, retornando os dados do usuário e o token JWT.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário autenticado com sucesso.',
    type: AutenticarResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'E-mail ou senha incorretos.',
    schema: {
      example: {
        statusCode: 401,
        message: 'E-mail ou senha incorretos.',
        error: 'CredenciaisInvalidasError',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos (falha de validação no DTO).',
    schema: {
      example: {
        statusCode: 400,
        message: ['e-mail precisa ser um e-mail válido', 'senha deve conter no mínimo 6 caracteres'],
        error: 'Bad Request',
      },
    },
  })
  async handle(@Body() body: AutenticarBodyDto) {

    const result = await this.autenticarUseCase.execute(body)
    return unwrapEither(result)
  }
}