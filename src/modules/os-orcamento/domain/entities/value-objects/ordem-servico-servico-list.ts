import { WatchedList } from '@/core/entities/watched-list.js' // Ajuste o path conforme seu projeto
import { OrdemServicoServico } from '../ordem-servico-servico.js'

export class OrdemServicoServicoList extends WatchedList<OrdemServicoServico> {

  /**
   * Compara dois serviços da OS para descobrir se representam o mesmo item.
   * Usado internamente pela WatchedList nos métodos add, remove e update.
   */
  public compareItems(a: OrdemServicoServico, b: OrdemServicoServico): boolean {
    return a.getId().equals(b.getId())
  }

}