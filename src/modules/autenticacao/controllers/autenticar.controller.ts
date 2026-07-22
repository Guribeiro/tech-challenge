import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { AutenticarUseCase } from '../application/use-cases/autenticar.js'
import { AutenticarBodyDto } from '../dto/autenticar.dto.js'

@Controller('sessions')
export class AutenticarController {
  constructor(private readonly autenticarUseCase: AutenticarUseCase) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: AutenticarBodyDto) {
    try {
      const result = await this.autenticarUseCase.execute(body)
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message)
      }
      throw error
    }
  }
}