import { AggregateRoot } from "@/core/entities/aggregate-root.js"
import { TermoLiberacaoEmitidoEvent } from "../events/termo-liberacao-emitido-event.js"
import { TermoLiberacaoPorRejeicaoEmitidoEvent } from "../events/termo-liberacao-por-rejeicao-emitido-event.js"

interface TermoLiberacaoProps {
  ordemServicoId: string
  placaVeiculo: string
  motivo: 'PAGAMENTO_APROVADO' | 'REJEICAO_ORCAMENTO'
  conteudo: string
  emitidoEm: Date
}

const termoLiberacaoVariations = {
  PAGAMENTO_APROVADO: 'Pagamento Confirmado',
  REJEICAO_ORCAMENTO: 'Orçamento Rejeitado'
}
export class TermoLiberacao extends AggregateRoot<TermoLiberacaoProps> {
  public static criar(props: Omit<TermoLiberacaoProps, 'conteudo' | 'emitidoEm'>, id?: string): TermoLiberacao {
    const emitidoEm = new Date()

    const conteudo = `
      ======================================================
      TERMO DE LIBERAÇÃO DE VEÍCULO - OS #${props.ordemServicoId}
      Emitido em: ${emitidoEm.toLocaleDateString()}
      Veículo Placa: ${props.placaVeiculo}
      Motivo da Liberação: ${termoLiberacaoVariations[props.motivo] ?? 'Serviço Finalizado'}
      ======================================================
    `

    const termo = new TermoLiberacao({
      ...props,
      emitidoEm,
      conteudo
    }, id)

    if (!id) {
      if (props.motivo === 'PAGAMENTO_APROVADO') {
        termo.addDomainEvent(new TermoLiberacaoEmitidoEvent(termo))
      } else if (props.motivo === 'REJEICAO_ORCAMENTO') {
        termo.addDomainEvent(new TermoLiberacaoPorRejeicaoEmitidoEvent(termo))
      }
    }
    return termo
  }

  public getOrdemServicoId(): string { return this.props.ordemServicoId }
  public getMotivo(): string { return this.props.motivo }
  public getConteudo(): string { return this.props.conteudo }
  public getPlacaVeiculo(): string { return this.props.placaVeiculo }
  public getEmitidoEm(): Date { return this.props.emitidoEm }
}