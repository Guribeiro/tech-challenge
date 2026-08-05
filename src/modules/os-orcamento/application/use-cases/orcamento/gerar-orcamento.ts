import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/ordem-servico-servico.js"
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/ordem-servico-componente.js"
import { OrcamentoServico } from "@/modules/os-orcamento/domain/entities/orcamento-servico.js"
import { OrcamentoComponente } from "@/modules/os-orcamento/domain/entities/orcamento-componente.js"
import { OrcamentoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/orcamento-servico-list.js"
import { OrcamentoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/orcamento-componente-list.js"
import { Injectable } from "@nestjs/common"

interface GerarOrcamentoInput {
  ordemServicoId: string
  clienteId: string
  servicos: OrdemServicoServico[]
  componentes: OrdemServicoComponente[]
}

interface GerarOrcamentoOutput {
  orcamento: Orcamento
}

@Injectable()
export class GerarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository
  ) { }

  public async execute(input: GerarOrcamentoInput): Promise<GerarOrcamentoOutput> {
    // 1. Instancia o Agregado de Orcamento com os dados vindos da OS

    const orcamentoId = new UniqueEntityID()

    const servicosOrcamento = input.servicos.map((s) =>
      OrcamentoServico.criar({
        orcamentoId,
        servicoId: s.getServicoId(),
        nome: s.getNome(),
        descricao: s.getDescricao(),
        categoria: s.getCategoria(),
        precoUnitario: s.getPrecoUnitario(),
      })
    )

    // 2. Mapeia os componentes da OS para o Snapshot de OrcamentoComponente
    const componentesOrcamento = input.componentes.map((c) =>
      OrcamentoComponente.criar({
        orcamentoId,
        produtoId: c.getProdutoId(),
        nome: c.getNome(),
        marca: c.getMarca(),
        precoCusto: c.getPrecoCusto(),
        tipo: c.getTipo(),
        codigoFabricante: c.getCodigoFabricante(),
        codigoSKU: c.getCodigoSKU(),
        descricao: c.getDescricao(),
        unidadeMedida: c.getUnidadeMedida(),
        quantidade: c.getQuantidade(),
        precoUnitario: c.getPrecoUnitario(),
      })
    )

    const orcamento = Orcamento.criar({
      ordemServicoId: new UniqueEntityID(input.ordemServicoId),
      clienteId: new UniqueEntityID(input.clienteId),
      servicos: new OrcamentoServicoList(servicosOrcamento),
      componentes: new OrcamentoComponenteList(componentesOrcamento),
    }, orcamentoId)

    orcamento.enviar()

    await this.orcamentoRepository.create(orcamento)

    return {
      orcamento
    }
  }
}