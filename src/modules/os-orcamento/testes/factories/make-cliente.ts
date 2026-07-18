import { fakerPT_BR as faker } from "@faker-js/faker";

import { Cliente, ClienteProps } from "@/modules/os-orcamento/domain/entities/cliente.js";
import { NomeCompleto } from "@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js";
import { Email } from "../../../../shared/domain/value-objects/email.js";
import { Telefone } from "../../domain/entities/value-objects/telefone.js";

export function makeCliente(override: Partial<ClienteProps> = {}): Cliente {
  const dddsValidos = [
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
    '21', '22', '24',                                     // RJ
    '27', '28',                                           // ES
    '31', '32', '33', '34', '35', '37', '38',             // MG
    '41', '42', '43', '44', '45', '46',                   // PR
    '47', '48', '49',                                     // SC
    '51', '53', '54', '55',                               // RS
    '61', '62', '64', '65', '66', '67',                   // Centro-Oeste
    '71', '73', '74', '75', '77', '79',                   // BA / SE
    '81', '82', '83', '84', '85', '86', '87', '88', '89', // Nordeste
    '91', '92', '93', '94', '95', '96', '97', '98', '99'  // Norte / MA
  ];

  // O Faker sorteia um DDD real de dentro da nossa lista
  const dddAleatorio = faker.helpers.arrayElement(dddsValidos);

  const celularValidoBruto = faker.helpers.replaceSymbols(`${dddAleatorio}9########`);

  const cliente = Cliente.criar({
    nome: NomeCompleto.criar(faker.person.fullName()),
    email: Email.criar(faker.internet.email()), //
    telefone: Telefone.criar(celularValidoBruto),
    tipo: 'PF',
    ...override
  })

  return cliente
}