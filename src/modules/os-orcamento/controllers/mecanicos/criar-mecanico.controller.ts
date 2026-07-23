import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { CriarMecanicoUseCase } from '../../application/use-cases/mecanicos/criar-mecanico.js'
import { CriarMecanicoBodyDto } from '../../dto/criar-mecanico.dto.js'

@Controller('mecanicos')
export class CriarMecanicoController {
  constructor(private readonly criarMecanico: CriarMecanicoUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: CriarMecanicoBodyDto) {
    try {
      const result = await this.criarMecanico.execute(body)
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}