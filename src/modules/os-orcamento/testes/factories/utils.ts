import { fakerPT_BR as faker } from "@faker-js/faker";

/**
 * Gera uma placa no padrão atual do Mercosul (ABC1D23)
 */
export function gerarPlacaMercosul(): string {
  // Letras iniciais (3 letras)
  const letras = faker.string.alpha({ length: 3, casing: 'upper' });
  // Primeiro número (1 dígito)
  const num1 = faker.string.numeric(1);
  // Letra do meio (1 letra - característica do Mercosul no lugar do 2º número)
  const letraMeio = faker.string.alpha({ length: 1, casing: 'upper' });
  // Dois números finais (2 dígitos)
  const numFinal = faker.string.numeric(2);

  return `${letras}${num1}${letraMeio}${numFinal}`; // Ex: BRA2E19
}

/**
 * Gera uma placa no padrão antigo brasileiro (ABC-1234)
 */
export function gerarPlacaAntiga(comHifen = false): string {
  const letras = faker.string.alpha({ length: 3, casing: 'upper' });
  const numeros = faker.string.numeric(4);

  return comHifen ? `${letras}-${numeros}` : `${letras}${numeros}`; // Ex: AMB-4921 ou AMB4921
}

/**
 * Sorteia aleatoriamente entre uma placa antiga e uma Mercosul para os testes
 */
export function gerarPlacaAleatoria(): string {
  return faker.helpers.arrayElement([gerarPlacaMercosul(), gerarPlacaAntiga(false)]);
}