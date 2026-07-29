import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { CriarServicoUseCase } from '../../application/use-cases/servicos/criar-servico.js'
import { ServicoPresenter } from '../../presenters/servico-presenter.js'
import { CriarServicoBodyDto } from '../../dto/servico/criar-servico-body.dto.js'
import { unwrapEither } from '@/infra/http/presenters/http-presenter.js'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('servicos')
export class CriarServicoController {
  constructor(private readonly criarServico: CriarServicoUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cadastrar um novo servico' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Serviço criado com sucesso.',
    type: CriarServicoBodyDto,
  })
  @ApiConflictResponse({
    description: 'Nome do serviço já cadastrado no sistema.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Já existe um serviço cadastrado com o nome {{nome}}.',
        error: 'ServicoJaCadastradoError',
      },
    },
  })

  async handle(@Body() body: CriarServicoBodyDto) {
    const result = await this.criarServico.execute(body)

    const { servico } = unwrapEither(result)
    return ServicoPresenter.toHTTP(servico)
  }
}