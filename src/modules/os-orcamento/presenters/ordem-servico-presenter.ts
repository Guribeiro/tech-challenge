import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OsServicoPresenter } from './os-servico-presenter.js'
import { OsComponenetePresenter } from './os-componente-presenter.js'

export class OrdemServicoPresenter {
  static toHTTP(os: OrdemServico) {
    return {
      id: os.getId().toValue(),
      clienteId: os.getClienteId().toValue(),
      mecanicoId: os.getMecanicoId()?.toValue() ?? undefined,
      veiculoId: os.getVeiculoId().toValue(),
      descricao: os.getDescricao(),
      prioridade: os.getPrioridade().getTipo(),
      garantia: os.getEGarantia(),
      status: os.getStatus(),
      servicos: os.getServicos().getItems().map(OsServicoPresenter.toHTTP),
      componentes: os.getComponentes().getItems().map(OsComponenetePresenter.toHTTP),
      criadoEm: os.getCriadoEm(),
      atualizadoEm: os.getAtualizadoEm(),
    }
  }
}