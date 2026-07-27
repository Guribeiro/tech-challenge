import { DomainEvents } from "@/core/events/domain-events.js";
import { EventHandler } from "@/core/events/event-handler.js";
import { OSExecucaoFinalizadaEvent } from "@/modules/os-orcamento/domain/events/os-execucao-finalizada-event.js";
import { DeduzirEstoqueUseCase } from "../use-cases/deduzir-estoque.js";
import { Injectable, OnModuleInit } from "@nestjs/common";

@Injectable()
export class OnOrdemServicoFinalizadaDeduzirEstoque implements EventHandler, OnModuleInit {
  constructor(
    private readonly deduzirEstoque: DeduzirEstoqueUseCase
  ) { }

  onModuleInit(): void {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    // Diz para o gerenciador central: "Quando o DiagnosticoConcluidoEvent rodar, me chama!"
    DomainEvents.register(
      this.executar.bind(this),
      OSExecucaoFinalizadaEvent.name
    )
  }

  private async executar(event: OSExecucaoFinalizadaEvent): Promise<void> {
    const { ordemServico } = event

    try {
      // 1. Extraímos os produtos/peças utilizados na OS
      // Supondo que sua OS tenha uma lista de itens (peças) adicionados
      const itensUtilizados = ordemServico.getComponentes().getItems().map(item => ({
        produtoId: item.getProdutoId().toValue(),
        quantidade: item.getQuantidade()
      }))

      // Se nenhum produto foi utilizado na OS, não precisamos deduzir nada
      if (itensUtilizados.length === 0) {
        console.log(`[Subscriber Info]: OS ${ordemServico.getId()} finalizada sem produtos a deduzir.`)
        return
      }
      // 2. ⚡ A REAÇÃO: Delegamos para o Caso de Uso processar a baixa
      await this.deduzirEstoque.execute({
        ordemServicoId: ordemServico.getId().toValue(),
        itens: itensUtilizados
      })


      console.log(`[Subscriber Success]: Orçamento gerado automaticamente para a OS ${ordemServico.getId()}`)
    } catch (error) {
      // Como eventos de domínio rodam em segundo plano, é vital ter um log de erro aqui
      console.error(
        `[Subscriber Error]: Falha ao gerar orçamento automático para a OS ${ordemServico.getId()}.`,
        error
      )
    }
  }
}