import { faker } from "@faker-js/faker";
import { ServicoProps, CategoriaServico } from "@/modules/os-orcamento/domain/entities/servico.js";
import { makeServico } from "./make-servico.js";
import { OrdemServicoServico } from "../../domain/entities/ordem-servico-servico.js";
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js";
import { OrdemServicoServicoList } from "../../domain/entities/value-objects/ordem-servico-servico-list.js";

type MakeOSServicoOverride = Partial<ServicoProps> & {
  servicoId?: UniqueEntityID
  observacao?: string
  precoUnitario?: number // ou valorCobrado, conforme seu construtor
}

export function makeOrdemServicoServicoList(
  itemsToOverride: MakeOSServicoOverride[] = [{}] // Se não passar nada, gera 1 item totalmente mockado
): OrdemServicoServicoList {

  const osServicos = itemsToOverride.map((override) => {
    // Array com as suas categorias para o Faker poder escolher uma aleatória caso não seja informada
    const categorias: CategoriaServico[] = ['SEGURANCA', 'MANUTENCAO_PREVENTIVA', 'ESTETICA', 'ELETRICA', 'MECANICA_GERAL']

    const categoriaAleatoria = faker.helpers.arrayElement(categorias)
    const precoAleatorio = Number(faker.commerce.price({ min: 80, max: 600, dec: 2 }))

    // 1. Gera o serviço do catálogo preenchendo com Faker o que não foi enviado no override
    const servicoBase = makeServico({
      nome: override.nome ?? faker.commerce.productName() + ' ' + faker.helpers.arrayElement(['Geral', 'Preventiva', 'Express']),
      categoria: override.categoria ?? categoriaAleatoria,
      descricao: override.descricao ?? faker.commerce.productDescription(),
      valorReferencia: override.precoUnitario ?? precoAleatorio,
    })

    // 2. Monta o Value Object da OS garantindo que até os campos exclusivos da OS tenham fallback do Faker
    return OrdemServicoServico.criar({
      servicoId: override.servicoId ?? servicoBase.getId(),
      nome: servicoBase.getNome(),
      categoria: servicoBase.getCategoria(),
      precoUnitario: servicoBase.getValorReferencia() ?? precoAleatorio, // Fallback duplo de segurança
      descricao: servicoBase.getDescricao(),
      observacao: override.observacao ?? faker.lorem.paragraph(0.5) ?? 'Nenhuma observação técnica.',
      ordemServicoId: new UniqueEntityID(), // Gera um ID aleatório para a OS, pois não temos uma OS real aqui
    })
  })

  return new OrdemServicoServicoList(osServicos)
}