import { OrdemServicoComponente } from '@/modules/os-orcamento/domain/entities/ordem-servico-componente.js'

export class OsComponenetePresenter {
  static toHTTP(componente: OrdemServicoComponente) {
    return {
      id: componente.getId().toValue(),
      nome: componente.getNome(),
      tipo: componente.getTipo(),
      marca: componente.getMarca(),
      codigoSKU: componente.getCodigoSKU(),
      codigoFabricante: componente.getCodigoFabricante(),
      descricao: componente.getDescricao(),
      precoCusto: componente.getPrecoCusto(),
      precoUnitario: componente.getPrecoUnitario(),

      unidadeMedida: componente.getUnidadeMedida(),
      criadoEm: componente.getCriadoEm(),
    }
  }
}