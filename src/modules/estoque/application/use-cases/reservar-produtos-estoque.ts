import { DomainEvents } from "@/core/events/domain-events.js"
import { ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js" // Seu repositório de Produtos/Estoque
import { ProdutosReservadosNoEstoqueEvent } from "@/modules/estoque/domain/events/produtos-reservados-no-estoque-event.js"

interface ReservarPecasEstoqueInput {
  ordemServicoId: string
  itens: Array<{
    produtoId: string
    quantidade: number
  }>
}

export class ReservarProdutosEstoqueUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository
  ) { }

  public async execute(input: ReservarPecasEstoqueInput): Promise<void> {
    // 1. Coleta todos os IDs dos produtos envolvidos
    const produtoIds = input.itens.map(item => item.produtoId)

    // 2. Busca todos em lote para performance (usando o findManyByIds que implementamos antes)
    const produtos = await this.produtoRepository.findManyByIds(produtoIds)

    if (produtos.length !== [...new Set(produtoIds)].length) {
      throw new Error("Alguns produtos solicitados para a reserva não foram encontrados no estoque.")
    }

    // 3. Efetua a reserva no domínio em memória
    for (const item of input.itens) {
      const produto = produtos.find(p => p.getId() === item.produtoId)

      if (produto) {
        produto.reservar(item.quantidade)
        // Persiste as alterações no produto individual
        await this.produtoRepository.save(produto)
      }
    }

    // 4. ⚡ Grita para o sistema: "Peças reservadas com sucesso para a OS tal!"
    // Isso vai disparar o próximo post-it roxo: disponibilizar a OS na fila.
    DomainEvents.dispatch(new ProdutosReservadosNoEstoqueEvent(input.ordemServicoId))
  }
}