import { ArgumentoInvalidoError } from "@/core/errors/domain-errors/argumento-invalido-error.js"

export class NomeCompleto {
  private readonly valor: string

  private constructor(valor: string) {
    this.valor = valor
  }

  public static criar(nome: string): NomeCompleto {
    if (!nome) {
      throw new ArgumentoInvalidoError('O nome do cliente não pode estar vazio.')
    }

    const nomeLimpo = nome.trim()

    NomeCompleto.validar(nomeLimpo)

    return new NomeCompleto(nomeLimpo)
  }

  /**
   * Método privado e isolado responsável estritamente pelas regras de validação
   */
  public static validar(nome: string): void {
    // Regra 1: Deve conter pelo menos nome e um sobrenome (mínimo de 2 palavras)
    const partesDoNome = nome.split(/\s+/)
    if (partesDoNome.length < 2) {
      throw new ArgumentoInvalidoError(
        'O cliente deve ser cadastrado com o nome completo (nome e sobrenome).',
      )
    }

    if (nome.length < 5) {
      throw new ArgumentoInvalidoError('O nome completo deve conter pelo menos 5 caracteres.')
    }

  }

  public getValor(): string {
    return this.valor
  }

  public equals(outroNome: NomeCompleto): boolean {
    return this.valor.toLowerCase() === outroNome.getValor().toLowerCase()
  }
}
