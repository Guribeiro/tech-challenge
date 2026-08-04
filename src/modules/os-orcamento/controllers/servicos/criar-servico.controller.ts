import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
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
import { JwtAuthGuard } from '@/infra/auth/jwt.guard.js'
import { RolesGuard } from '@/infra/auth/roles.guard.js'
import { Roles } from '@/infra/auth/roles.decorator.js'

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('servicos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CriarServicoController {
  constructor(private readonly criarServico: CriarServicoUseCase) { }

  @Post()
  @Roles('ADMIN', 'RECEPCAO')
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
    return {
      servico: ServicoPresenter.toHTTP(servico)
    }
  }
}