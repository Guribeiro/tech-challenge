import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'

export class VeiculoPresenter {
  static toHTTP(veiculo: Veiculo) {
    return {
      id: veiculo.getId().toValue(),
      placa: veiculo.getPlaca().getValor(),
      clienteId: veiculo.getClienteId().toValue(),
      marca: veiculo.getMarca(),
      modelo: veiculo.getModelo(),
      ano: veiculo.getAno(),
      cor: veiculo.getCor(),
      quilometragem: veiculo.getQuilometragem(),
      combustivel: veiculo.getCombustivel(),
      observacoes: veiculo.getObservacoes(),
      criadoEm: veiculo.getCriadoEm(),
      atualizadoEm: veiculo.getAtualizadoEm(),
      deletadoEm: veiculo.getDeletadoEm()
    }
  }
}