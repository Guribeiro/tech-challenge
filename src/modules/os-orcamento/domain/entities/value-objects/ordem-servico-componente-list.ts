import { WatchedList } from '@/core/entities/watched-list.js'
import { OrdemServicoComponente } from './ordem-servico-componente.js'

export class OrdemServicoComponenteList extends WatchedList<OrdemServicoComponente> {
  /**
   * Compara dois componentes da OS usando o produtoId.
   * Se o mecânico alterar a quantidade ou preço, a WatchedList entenderá
   * que é o mesmo item do estoque sendo atualizado/substituído no banco.
   */
  public compareItems(a: OrdemServicoComponente, b: OrdemServicoComponente): boolean {
    return a.getProdutoId().equals(b.getProdutoId())
  }
}