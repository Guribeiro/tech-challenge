import { WatchedList } from '@/core/entities/watched-list.js'
import { OrcamentoComponente } from '../orcamento-componente.js'

export class OrcamentoComponenteList extends WatchedList<OrcamentoComponente> {
  /**
   * Compara dois componentes da OS usando o id.
   * Se o mecânico alterar a quantidade ou preço, a WatchedList entenderá
   * que é o mesmo item do estoque sendo atualizado/substituído no banco.
   */
  public compareItems(a: OrcamentoComponente, b: OrcamentoComponente): boolean {
    return a.getId().equals(b.getId())
  }
}