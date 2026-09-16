import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'

export class ClientePresenter {
  static toHTTP(cliente: Cliente) {
    return {
      id: cliente.getId().toValue(),
      nome: cliente.getNome().getValor(),
      email: cliente.getEmail().getValor(),
      documento: cliente.getDocumento().getValor(),
      telefone: cliente.getTelefone().getValorFormatado(),
      tipo: cliente.getTipo(),
      criadoEm: cliente.getCriadoEm(),
      atualizadoEm: cliente.getAtualizadoEm(),
      deletadoEm: cliente.getDeletadoEm()
    }
  }
}