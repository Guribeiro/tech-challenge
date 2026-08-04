import { DomainEvents } from "@/core/events/domain-events.js";
import { EventHandler } from "@/core/events/event-handler.js";
import { OSExecucaoFinalizadaEvent } from "@/modules/os-orcamento/domain/events/os-execucao-finalizada-event.js";
import { DeduzirEstoqueUseCase } from "../use-cases/deduzir-estoque.js";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class OnOrdemServicoFinalizadaDeduzirEstoque implements EventHandler {
  private readonly logger = new Logger(OnOrdemServicoFinalizadaDeduzirEstoque.name)
  constructor(
    private readonly deduzirEstoque: DeduzirEstoqueUseCase
  ) {
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
      const itensUtilizados = ordemServico.getComponentes().getItems().map(item => ({
        produtoId: item.getProdutoId().toValue(),
        quantidade: item.getQuantidade()
      }))

      if (itensUtilizados.length === 0) {
        this.logger.log(`[Subscriber Info]: OS ${ordemServico.getId().toValue()} finalizada sem produtos a deduzir.`)
        return
      }
      // 2. ⚡ A REAÇÃO: Delegamos para o Caso de Uso processar a baixa
      const result = await this.deduzirEstoque.execute({
        ordemServicoId: ordemServico.getId().toValue(),
        itens: itensUtilizados
      })

      if (result.isLeft()) {
        this.logger.warn(`[Subscriber Left Error]: Falha ao deduzir estoque para a OS ${ordemServico.getId().toValue()}. Erro: ${result.value.message}`)
        return
      }

      this.logger.log(`[Subscriber Success]: Orçamento gerado automaticamente para a OS ${ordemServico.getId().toValue()}`)
    } catch (error) {
      // Como eventos de domínio rodam em segundo plano, é vital ter um log de erro aqui
      this.logger.error(
        `[Subscriber Error]: Falha ao gerar orçamento automático para a OS ${ordemServico.getId().toValue()}.`,
        error
      )
    }
  }
}