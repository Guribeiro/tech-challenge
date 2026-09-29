import { Either, left, right } from '@/core/either.js'
import { TokenRepository } from '../../../domain/repositories/token-repository.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { AcessoNegadoError } from '@/core/errors/acesso-negado-error.js'
import { Injectable } from '@nestjs/common'

interface ValidarTokenOrcamentoUseCaseRequest {
  token: string
}

type ValidarTokenOrcamentoUseCaseResponse = Either<
  RecursoNaoEncontradoError | AcessoNegadoError,
  {
    orcamentoId: string
  }
>

@Injectable()
export class ValidarTokenOrcamentoUseCase {
  constructor(private tokenRepository: TokenRepository) { }

  async execute({
    token: tokenString,
  }: ValidarTokenOrcamentoUseCaseRequest): Promise<ValidarTokenOrcamentoUseCaseResponse> {
    const token = await this.tokenRepository.findByToken(tokenString)

    if (!token) {
      return left(new RecursoNaoEncontradoError())
    }

    if (token.getUsado() || token.estaExpirado()) {
      return left(new AcessoNegadoError())
    }

    if (!token.getOrcamentoId()) {
      return left(new RecursoNaoEncontradoError())
    }

    return right({
      orcamentoId: token.getOrcamentoId()!,
    })
  }
}