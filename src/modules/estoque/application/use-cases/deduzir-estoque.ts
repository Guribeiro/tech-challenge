import { Injectable } from "@nestjs/common"
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js"

interface ItemDeducao {
  produtoId: string
  quantidade: number
}

interface DeduzirEstoqueInput {
  ordemServicoId: string
  itens: ItemDeducao[]
}

@Injectable()
export class DeduzirEstoqueUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository
  ) { }

  public async execute(input: DeduzirEstoqueInput): Promise<void> {
    // Para cada item utilizado na OS, fazemos a dedução no estoque
    for (const item of input.itens) {
      const produto = await this.produtoRepository.findById(item.produtoId)

      if (!produto) {
        throw new Error(`Produto com ID ${item.produtoId} não encontrado no estoque para dedução.`)
      }

      produto.confirmarReservaEDeduzir(item.quantidade)

      // Salva a nova fotografia do produto atualizado
      await this.produtoRepository.save(produto)
    }

    console.log(`[Estoque]: Estoque deduzido com sucesso para os itens da OS #${input.ordemServicoId}`)
  }
}