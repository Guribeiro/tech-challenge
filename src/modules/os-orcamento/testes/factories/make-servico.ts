import { faker } from "@faker-js/faker";

import { Servico, ServicoProps } from "@/modules/os-orcamento/domain/entities/servico.js";
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js";

export function makeServico(override: Partial<ServicoProps> = {}, id?: UniqueEntityID): Servico {
  const veiculo = Servico.criar({
    categoria: 'ELETRICA',
    nome: faker.lorem.text(),
    descricao: faker.lorem.paragraph(),
    valorReferencia: faker.number.int({ min: 1, max: 10 }),
    ...override
  }, id)
  return veiculo
}