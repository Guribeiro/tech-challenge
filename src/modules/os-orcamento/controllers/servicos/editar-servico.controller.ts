import { Body, Controller, HttpCode, HttpStatus, Param, Post, Put, UnauthorizedException } from '@nestjs/common'
import { EditarServicoUseCase } from '../../application/use-cases/servicos/editar-servico.js'
import { ServicoPresenter } from '../../presenters/servico-presenter.js'
import { EditarServicoBodyDto } from '../../dto/editar-servico-body.dto.js'

@Controller('servicos')
export class EditarServicoController {
  constructor(private readonly editarServico: EditarServicoUseCase) { }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('id') id: string,
    @Body() body: EditarServicoBodyDto
  ) {
    try {
      const { servico } = await this.editarServico.execute({
        id,
        ...body
      })
      return ServicoPresenter.toHTTP(servico)
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}