import { Either, right } from '@/core/either.js'
import { TokenRepository } from '@/modules/os-orcamento/domain/repositories/token-repository.js'
import { Token } from '@/modules/os-orcamento/domain/entities/token.js'
import { TokenType } from '@/modules/os-orcamento/domain/entities/value-objects/token-type.js'
import { Injectable } from '@nestjs/common'

interface GerarTokenAprovacaoOrcamentoUseCaseRequest {
  orcamentoId: string
}

type GerarTokenAprovacaoOrcamentoUseCaseResponse = Either<
  null,
  {
    token: Token
  }
>

@Injectable()
export class GerarTokenAprovacaoOrcamentoUseCase {
  constructor(private tokenRepository: TokenRepository) { }

  async execute({
    orcamentoId,
  }: GerarTokenAprovacaoOrcamentoUseCaseRequest): Promise<GerarTokenAprovacaoOrcamentoUseCaseResponse> {
    const token = Token.create({
      orcamentoId,
      tipo: TokenType.APROVACAO_ORCAMENTO,
    })

    await this.tokenRepository.create(token)

    return right({ token })
  }
}