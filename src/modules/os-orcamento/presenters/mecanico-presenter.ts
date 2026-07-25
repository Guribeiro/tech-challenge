import { Mecanico } from '@/modules/os-orcamento/domain/entities/mecanico.js'

export class MecanicoPresenter {
  static toHTTP(cliente: Mecanico) {
    return {
      id: cliente.getId().toValue(),
      nome: cliente.getNome().getValor(),
      email: cliente.getEmail().getValor(),
      especialidade: cliente.getEspecialidade(),
      criadoEm: cliente.getCriadoEm(),
      atualizadoEm: cliente.getAtualizadoEm(),
      desativadoEm: cliente.getDesativadoEm(),
    }
  }
}