import { Either, left, right } from '@/core/either.js'
import { TokenRepository } from '@/modules/os-orcamento/domain/repositories/token-repository.js'
import { OrcamentoRepository } from '@/modules/os-orcamento/domain/repositories/orcamento-repository.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { AcessoNegadoError } from '@/core/errors/acesso-negado-error.js'
import { Injectable } from '@nestjs/common'

interface ProcessarDecisaoOrcamentoUseCaseRequest {
  token: string
  decisao: 'APROVADO' | 'RECUSADO'
  motivoRecusa?: string
}

type ProcessarDecisaoOrcamentoUseCaseResponse = Either<
  RecursoNaoEncontradoError | AcessoNegadoError,
  null
>

@Injectable()
export class ProcessarDecisaoOrcamentoUseCase {
  constructor(
    private tokenRepository: TokenRepository,
    private orcamentoRepository: OrcamentoRepository,
  ) { }

  async execute({
    token: tokenString,
    decisao,
  }: ProcessarDecisaoOrcamentoUseCaseRequest): Promise<ProcessarDecisaoOrcamentoUseCaseResponse> {
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

    const orcamento = await this.orcamentoRepository.findById(token.getOrcamentoId()!)

    if (!orcamento) {
      return left(new RecursoNaoEncontradoError())
    }

    if (!['ENVIADO', 'RENEGOCIADO'].includes(orcamento.getStatus())) {
      return left(new AcessoNegadoError('Este orçamento não está mais disponível para decisão.'))
    }

    if (decisao === 'APROVADO') {
      orcamento.aprovar()
    } else {
      orcamento.recusar()
    }

    token.marcarComoUsado()

    await this.orcamentoRepository.save(orcamento)
    await this.tokenRepository.save(token)

    return right(null)
  }
}