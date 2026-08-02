import { DomainEvents } from "@/core/events/domain-events.js"
import { ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js" // Seu repositório de Produtos/Estoque
import { ProdutosReservadosNoEstoqueEvent } from "@/modules/estoque/domain/events/produtos-reservados-no-estoque-event.js"
import { Injectable } from "@nestjs/common"

interface ReservarPecasEstoqueInput {
  ordemServicoId: string
  itens: Array<{
    produtoId: string
    quantidade: number
  }>
}

@Injectable()
export class ReservarProdutosEstoqueUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository
  ) { }

  public async execute(input: ReservarPecasEstoqueInput): Promise<void> {
    // 1. Coleta todos os IDs dos produtos envolvidos
    const produtoIds = input.itens.map(item => item.produtoId)

    // 2. Busca todos em lote para performance (usando o findManyByIds que implementamos antes)
    const produtos = await this.produtoRepository.findManyByIds(produtoIds)

    if (produtos.length !== new Set(produtoIds).size) {
      throw new Error("Alguns produtos solicitados para a reserva não foram encontrados no estoque.")
    }

    // 3. Efetua a reserva no domínio em memória
    for (const item of input.itens) {
      const produto = produtos.find(p => p.getId().toValue() === item.produtoId)

      if (produto) {
        produto.reservar(item.quantidade)
        // Persiste as alterações no produto individual
        await this.produtoRepository.save(produto)
      }
    }

    DomainEvents.dispatch(new ProdutosReservadosNoEstoqueEvent(input.ordemServicoId))
  }
}