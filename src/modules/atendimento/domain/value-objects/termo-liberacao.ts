
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

export class TermoLiberacao {
  private props: TermoLiberacaoProps

  private constructor(props: TermoLiberacaoProps) {
    this.props = props
  }

  // O Value Object garante que suas propriedades internas sejam válidas na criação
  public static criar(props: Omit<TermoLiberacaoProps, 'conteudo' | 'emitidoEm'>): TermoLiberacao {
    const emitidoEm = new Date()

    // Regra de formatação do documento encapsulada aqui
    const conteudo = `
      ======================================================
      TERMO DE LIBERAÇÃO DE VEÍCULO - OS #${props.ordemServicoId}
      Emitido em: ${emitidoEm.toLocaleDateString()}
      Veículo Placa: ${props.placaVeiculo}
      Motivo da Liberação: ${termoLiberacaoVariations[props.motivo] ?? 'Serviço Finalizado'}
      ======================================================
    `

    return new TermoLiberacao({
      ...props,
      emitidoEm,
      conteudo
    })
  }

  public getConteudo(): string {
    return this.props.conteudo
  }

  public getPlacaVeiculo(): string {
    return this.props.placaVeiculo
  }

  public getEmitidoEm(): Date {
    return this.props.emitidoEm
  }

  // Comparação padrão de Value Objects (igualdade por valor, não por ID)
  public equals(vo: TermoLiberacao): boolean {
    return this.props.conteudo === vo.getConteudo()
  }
}