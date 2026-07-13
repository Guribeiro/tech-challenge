import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js"
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente.js"

interface GerarOrcamentoInput {
  ordemServicoId: string
  clienteId: string
  servicos: OrdemServicoServico[]
  componentes: OrdemServicoComponente[]
}

interface GerarOrcamentoOutput {
  orcamento: Orcamento
}

export class GerarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository
  ) { }

  public async execute(input: GerarOrcamentoInput): Promise<GerarOrcamentoOutput> {
    // 1. Instancia o Agregado de Orcamento com os dados vindos da OS
    const orcamento = Orcamento.criar({
      ordemServicoId: new UniqueEntityID(input.ordemServicoId),
      clienteId: new UniqueEntityID(input.clienteId),
      servicos: input.servicos,
      componentes: input.componentes,
      status: 'CRIADO' // Nasce como criado
    })

    // 2. Regra de Negócio: Se a oficina envia o orçamento imediatamente após o diagnóstico,
    // nós executamos o método de negócio que altera o status e adiciona o 'OrcamentoEnviadoEvent'
    orcamento.enviar()

    // 3. Persiste o orçamento no banco de dados
    // O orcamentoRepository.save vai disparar o OrcamentoEnviadoEvent automaticamente!
    await this.orcamentoRepository.save(orcamento)

    return {
      orcamento
    }
  }
}