import { faker } from '@faker-js/faker'
import { Produto, ProdutoProps, TipoProduto, UnidadeMedida } from '@/modules/estoque/domain/entities/produto.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export function makeProduto(
  override: Partial<ProdutoProps> = {},
  id?: UniqueEntityID,
): Produto {
  const tipos: TipoProduto[] = ['PECA', 'INSUMO']
  const unidades: UnidadeMedida[] = ['UN', 'L', 'KG', 'JOGO', 'METRO']

  const tipoAleatorio = faker.helpers.arrayElement(tipos)
  const unidadeAleatoria = faker.helpers.arrayElement(unidades)

  const nomeAleatorio =
    tipoAleatorio === 'PECA'
      ? `${faker.vehicle.type()} ${faker.helpers.arrayElement([
        'Pastilha de Freio',
        'Filtro de Óleo',
        'Amortecedor',
        'Correia Dentada',
      ])}`
      : `${faker.helpers.arrayElement([
        'Óleo Sintético 5W30',
        'Fluido de Freio DOT4',
        'Aditivo de Radiador',
        'Graxa de Chassi',
      ])}`

  // Garante coerência entre preço de custo e venda para evitar erro de validação do domínio
  const precoCustoPadrao = Number(faker.commerce.price({ min: 10, max: 400, dec: 2 }))
  const precoUnitarioPadrao = Number((precoCustoPadrao * 1.4).toFixed(2)) // 40% de margem por padrão

  // Garante estoques válidos (estoque >= reservada e máximo >= mínimo)
  const quantidadeEstoquePadrao = faker.number.int({ min: 10, max: 100 })
  const quantidadeReservadaPadrao = faker.number.int({ min: 0, max: Math.min(5, quantidadeEstoquePadrao) })
  const estoqueMinimoPadrao = 5
  const estoqueMaximoPadrao = 150

  const produto = Produto.criar(
    {
      nome: nomeAleatorio,
      tipo: tipoAleatorio,
      marca: faker.company.name(),
      codigoSKU: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      codigoFabricante: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
      descricao: faker.commerce.productDescription(),

      precoCusto: precoCustoPadrao,
      precoUnitario: precoUnitarioPadrao,

      quantidadeEstoque: quantidadeEstoquePadrao,
      quantidadeReservada: quantidadeReservadaPadrao,

      estoqueMinimo: estoqueMinimoPadrao,
      estoqueMaximo: estoqueMaximoPadrao,
      unidadeMedida: unidadeAleatoria,
      localizacao: `Prateleira ${faker.string.alpha({ casing: 'upper' })}-${faker.number.int({ min: 1, max: 20 })}`,

      criadoEm: new Date(),
      desativadoEm: null,

      // Sobrescreve quaisquer propriedades passadas pelo teste
      ...override,
    },
    id,
  )

  return produto
}