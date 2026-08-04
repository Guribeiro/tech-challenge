// test/factories/make-ordem-servico.ts
import { faker } from '@faker-js/faker'

import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import {
  OrdemServico,
  OrdemServicoProps,
} from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OrdemServicoServicoList } from '../../domain/entities/value-objects/ordem-servico-servico-list.js'
import { OrdemServicoComponenteList } from '../../domain/entities/value-objects/ordem-servico-componente-list.js'
import { Prioridade } from '../../domain/entities/value-objects/prioridade.js'

const categoriasPossiveis = [
  'FREIO',
  'REVISAO',
  'FUNILARIA',
  'SUSPENSAO',
  'MOTOR',
  'INJECAO',
  'ALINHAMENTO',
]

export function makeOrdemServico(
  override: Partial<OrdemServicoProps> = {},
  id?: UniqueEntityID,
): OrdemServico {
  const ordemServico = OrdemServico.criar(
    {
      clienteId: new UniqueEntityID(faker.string.uuid()),
      veiculoId: new UniqueEntityID(faker.string.uuid()),
      mecanicoId: new UniqueEntityID(faker.string.uuid()),
      descricao: faker.lorem.paragraph(),
      prioridade: Prioridade.calcular({
        eGarantia: faker.datatype.boolean(),
        eClienteCorporativo: faker.datatype.boolean(),
        anoVeiculo: faker.date.past({ years: 20 }).getFullYear(),
        categoriasDosServicos: faker.helpers.arrayElements(categoriasPossiveis, {
          min: 1,
          max: 3,
        }),
      }),
      eGarantia: faker.datatype.boolean(),
      servicos: new OrdemServicoServicoList(),
      componentes: new OrdemServicoComponenteList(),
      status: 'RECEBIDA',
      criadoEm: faker.date.recent(),
      ...override,
    },
    id,
  )

  return ordemServico
}