import { faker } from "@faker-js/faker";
import { Produto, ProdutoProps, TipoProduto } from "@/modules/estoque/domain/entities/produto.js";
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js";

export function makeProduto(override: Partial<ProdutoProps> = {}, id?: UniqueEntityID): Produto {
  const tipos: TipoProduto[] = ['PECA', 'INSUMO']
  const tipoAleatorio = faker.helpers.arrayElement(tipos)

  const nomeAleatorio = tipoAleatorio === 'PECA'
    ? `${faker.vehicle.type()} ${faker.helpers.arrayElement(['Pastilha Freio', 'Filtro Óleo', 'Amortecedor', 'Correia Dentada'])}`
    : `${faker.helpers.arrayElement(['Óleo Sintético 5W30', 'Fluido de Freio DOT4', 'Aditivo Radiador', 'Graxa de Chassi'])}`

  const produto = Produto.criar({
    nome: override.nome ?? nomeAleatorio,
    tipo: override.tipo ?? tipoAleatorio,
    precoUnitario: override.precoUnitario ?? Number(faker.commerce.price({ min: 15, max: 850, dec: 2 })),
    quantidadeEstoque: override.quantidadeEstoque ?? faker.number.int({ min: 0, max: 100 }),
    descricao: override.descricao ?? faker.commerce.productDescription(),
    criadoEm: override.criadoEm ?? new Date(),
    desativadoEm: override.desativadoEm ?? null,
    ...override
  }, id)

  return produto
}