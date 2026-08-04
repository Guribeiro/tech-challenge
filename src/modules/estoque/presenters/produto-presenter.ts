import { Produto } from "../domain/entities/produto.js";

export class ProdutoPresenter {
  static toHTTP(produto: Produto) {
    return {
      id: produto.getId().toValue(),
      nome: produto.getNome(),
      tipo: produto.getTipo(),
      marca: produto.getMarca(),
      codigoSKU: produto.getCodigoSKU(),
      codigoFabricante: produto.getCodigoFabricante(),
      descricao: produto.getDescricao(),
      precoCusto: produto.getPrecoCusto(),
      precoUnitario: produto.getPrecoUnitario(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      quantidadeReservada: produto.getQuantidadeReservada() ?? 0,

      // Dado derivado útil para a API/Front (Estoque Real Livre)
      quantidadeDisponivel: produto.getQuantidadeDisponivel(),

      estoqueMinimo: produto.getEstoqueMinimo(),
      estoqueMaximo: produto.getEstoqueMaximo(),
      unidadeMedida: produto.getUnidadeMedida(),
      localizacao: produto.getLocalizacao(),
      criadoEm: produto.getCriadoEm(),
      atualizadoEm: produto.getAtualizadoEm(),
      desativadoEm: produto.getDesativadoEm(),
    }
  }
}