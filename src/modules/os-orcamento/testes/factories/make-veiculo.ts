import { faker } from "@faker-js/faker";

import { Veiculo, VeiculoProps } from "@/modules/os-orcamento/domain/entities/veiculo.js";
import { Placa } from "../../domain/entities/value-objects/placa.js";
import { gerarPlacaMercosul } from "./utils.js";

export function makeVeiculo(override: Partial<VeiculoProps> = {}): Veiculo {
  const veiculo = Veiculo.criar({
    placa: Placa.criar(gerarPlacaMercosul()),
    marca: faker.vehicle.manufacturer(),
    modelo: faker.vehicle.model(),
    ano: faker.number.int({ min: 1900, max: new Date().getFullYear() }),
    cor: faker.color.human(),
    quilometragem: faker.number.int({ min: 0, max: 200000 }),
    combustivel: faker.vehicle.fuel(),
    observacoes: faker.lorem.sentence(),
    ...override
  })
  return veiculo
}