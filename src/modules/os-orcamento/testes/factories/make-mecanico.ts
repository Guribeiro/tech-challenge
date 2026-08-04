import { faker } from "@faker-js/faker";
import { generate as gerarCpf } from 'gerador-validador-cpf'

import { Mecanico, MecanicoProps } from "@/modules/os-orcamento/domain/entities/mecanico.js";
import { Cpf } from "@/modules/os-orcamento/domain/entities/value-objects/cpf.js";
import { NomeCompleto } from "@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js";
import { Email } from "@/shared/domain/value-objects/email.js";
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js";

export function makeMecanico(override: Partial<MecanicoProps> = {}, id?: UniqueEntityID): Mecanico {
  const mecanico = Mecanico.criar({
    nome: NomeCompleto.criar(faker.person.fullName()),
    email: Email.criar(faker.internet.email()),
    cpf: Cpf.criar(gerarCpf()), //
    especialidade: 'Mecânica',
    ...override
  }, id)
  return mecanico
}