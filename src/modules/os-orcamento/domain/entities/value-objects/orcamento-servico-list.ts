import { WatchedList } from '@/core/entities/watched-list.js' // Ajuste o path conforme seu projeto
import { OrcamentoServico } from '../orcamento-servico.js'

export class OrcamentoServicoList extends WatchedList<OrcamentoServico> {

  /**
   * Compara dois serviços da OS para descobrir se representam o mesmo item.
   * Usado internamente pela WatchedList nos métodos add, remove e update.
   */
  public compareItems(a: OrcamentoServico, b: OrcamentoServico): boolean {
    return a.getId().equals(b.getId())
  }

}