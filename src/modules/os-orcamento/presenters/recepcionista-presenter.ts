import { Recepcionista } from '@/modules/os-orcamento/domain/entities/recepcionista.js'

export class RecepcionistaPresenter {
  static toHTTP(data: Recepcionista) {
    return {
      id: data.getId().toValue(),
      nome: data.getNome().getValor(),
      email: data.getEmail().getValor(),
      criadoEm: data.getCriadoEm(),
      atualizadoEm: data.getAtualizadoEm(),
      desativadoEm: data.getDesativadoEm(),
    }
  }
}