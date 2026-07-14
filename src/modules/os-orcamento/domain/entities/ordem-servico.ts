import { Servico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { Optional } from '@/core/types/optional.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { OrdemServicoServicoList } from './value-objects/ordem-servico-servico-list.js'
import { OrdemServicoComponenteList } from './value-objects/ordem-servico-componente-list.js'
import { OrdemServicoServico } from './value-objects/ordem-servico-servico.js'
import { OrdemServicoComponente } from './value-objects/ordem-servico-componente.js'
import { DiagnosticoConcluidoEvent } from '../events/diagnostico-concluido-event.js'
import { DiagnosticoInicializadoEvent } from '../events/diagnostico-inicializado-event.js'
import { OSExecucaoAutorizadaEvent } from '../events/os-execucao-autorizada-event.js'
import { OSExecucaoIniciadaEvent } from '../events/os-execucao-iniciada-event.js'

export type StatusOS =
  | 'RECEBIDA'
  | 'EM_DIAGNOSTICO'
  | 'AGUARDANDO_APROVACAO'
  | 'EM_EXECUCAO'
  | 'AUTORIZADA'
  | 'PRONTA_PARA_INICIAR'
  | 'FINALIZADA'
  | 'ENTREGUE'
  | 'ENCERRADA_REJEICAO'

export type OrdemServicoProps = {
  clienteId: UniqueEntityID
  veiculoId: UniqueEntityID
  mecanicoId?: UniqueEntityID
  descricao: string
  prioridade: Prioridade
  eGarantia: boolean
  servicos: OrdemServicoServicoList
  componentes: OrdemServicoComponenteList
  status: StatusOS
  criadoEm: Date
  atualizadoEm?: Date
}

export class OrdemServico extends AggregateRoot<OrdemServicoProps> {
  public static criar(
    props: Optional<OrdemServicoProps, 'status' | 'mecanicoId' | 'criadoEm'>,
    id?: string,
  ): OrdemServico {
    const propriedadesCompletas: OrdemServicoProps = {
      ...props,
      servicos: props.servicos ?? new OrdemServicoServicoList(),
      componentes: props.componentes ?? new OrdemServicoComponenteList(),
      status: props.status ?? 'RECEBIDA',
      criadoEm: new Date()
    }

    this.validar(propriedadesCompletas)

    return new OrdemServico(propriedadesCompletas, id)
  }

  private static validar(props: OrdemServicoProps): void {
    if (!props.clienteId || !props.veiculoId || !props.descricao?.trim()) {
      throw new Error(
        'Cliente, veículo e descrição são obrigatórios para uma ordem de serviço.',
      )
    }

    if (props.servicos && props.servicos.getItems().some((item) => !item)) {
      throw new Error(
        'Cada serviço solicitado precisa apontar para uma entidade de serviço válida.',
      )
    }

    if (
      props.componentes &&
      props.componentes.getItems().some(
        (item) => !item.getDescricao()?.trim() || item.getQuantidade() <= 0,
      )
    ) {
      throw new Error(
        'Cada item precisa de descrição válida e quantidade maior que zero.',
      )
    }
  }

  public getClienteId(): UniqueEntityID {
    return this.props.clienteId
  }

  public getVeiculoId(): UniqueEntityID {
    return this.props.veiculoId
  }

  public getDescricao(): string {
    return this.props.descricao
  }

  public getServicos(): OrdemServicoServicoList {
    return this.props.servicos
  }

  public getComponentes(): OrdemServicoComponenteList {
    return this.props.componentes
  }

  public getStatus(): StatusOS {
    return this.props.status
  }

  public getPrioridade(): Prioridade {
    return this.props.prioridade
  }

  public getMecanicoId(): UniqueEntityID | undefined {
    return this.props.mecanicoId
  }

  public iniciarDiagnostico(mecanicoId: UniqueEntityID): void {
    if (this.props.status !== 'RECEBIDA') {
      throw new Error('O diagnóstico só pode ser iniciado para ordens de serviço recebidas.')
    }

    this.props.status = 'EM_DIAGNOSTICO'
    this.props.mecanicoId = mecanicoId

    this.addDomainEvent(
      new DiagnosticoInicializadoEvent(new UniqueEntityID(this.getId()), this.getClienteId())
    )
  }

  public concluirDiagnostico(
    servicos?: OrdemServicoServico[],
    componentes?: OrdemServicoComponente[]
  ): void {
    if (this.props.status !== 'EM_DIAGNOSTICO') {
      throw new Error('A ordem de serviço precisa estar EM_DIAGNOSTICO para concluir esta etapa.')
    }

    if (servicos) {
      this.props.servicos.update(servicos)
    }

    if (componentes) {
      this.props.componentes.update(componentes)
    }

    this.props.status = 'AGUARDANDO_APROVACAO'

    this.addDomainEvent(new DiagnosticoConcluidoEvent(this))
  }

  public autorizaExecucao(): void {
    // 1. Regra de Transição de Estado (Guarda de segurança)
    if (this.props.status !== 'AGUARDANDO_APROVACAO') {
      throw new Error(
        `Não é possível iniciar a execução de uma ordem de serviço com o status atual: ${this.props.status}. ` +
        `A OS precisa estar no status AGUARDANDO_APROVACAO.`
      )
    }

    // 2. Aplica a alteração de estado
    this.props.status = 'AUTORIZADA'
    this.props.atualizadoEm = new Date()

    // Opcional: Se no seu Event Storming houver alguma consequência física que precise 
    // acontecer imediatamente quando o mecânico começa a trabalhar (ex: reservar peças no estoque),
    // você registraria um evento aqui:
    this.addDomainEvent(new OSExecucaoAutorizadaEvent(this))
  }

  public marcarComoProntaParaIniciar(): void {
    // Garante a consistência: ela só pode ficar pronta se já foi autorizada previamente
    if (this.props.status !== 'AUTORIZADA') {
      throw new Error(
        `Não é possível marcar a OS como pronta a partir do status: ${this.props.status}. ` +
        `A OS precisa estar no status AUTORIZADA.`
      )
    }

    this.props.status = 'PRONTA_PARA_INICIAR'
    this.props.atualizadoEm = new Date()

    // Se você quiser notificar o frontend em tempo real (via WebSockets/SSE) 
    // que uma nova OS surgiu na fila do mecânico, você poderia registrar um evento aqui:
    // this.addDomainEvent(new OrdemServicoProntaParaIniciarEvent(this))
  }

  public iniciaExecucao(): void {
    // Garante a consistência: ela só pode ficar pronta se já foi autorizada previamente
    if (this.props.status !== 'PRONTA_PARA_INICIAR') {
      throw new Error(
        `Não é possível iniciar OS a partir do status: ${this.props.status}. ` +
        `A OS precisa estar no status PRONTA_PARA_INICIAR.`
      )
    }

    this.props.status = 'EM_EXECUCAO'
    this.props.atualizadoEm = new Date()

    // Se você quiser notificar o frontend em tempo real (via WebSockets/SSE) 
    // que uma nova OS surgiu na fila do mecânico, você poderia registrar um evento aqui:
    this.addDomainEvent(new OSExecucaoIniciadaEvent(this))
  }

  public getValorTotalCalculado(): number {
    const totalServicos = this.props.servicos.getItems().reduce((acc, osServico) => {
      return acc + osServico.getPrecoUnitario()
    }, 0)

    const totalComponentes = this.props.componentes.getItems().reduce((acc, item) => {
      return acc + item.getSubtotal() // ◄── Invoca o método encapsulado no VO
    }, 0)

    return totalServicos + totalComponentes
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      clienteId: this.props.clienteId,
      veiculoId: this.props.veiculoId,
      descricao: this.props.descricao,
      services: this.getServicos().getItems(),
      componentes: this.getComponentes().getItems()
    }
  }
}
