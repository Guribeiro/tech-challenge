import { ArgumentoInvalidoError } from "@/core/errors/domain-errors/argumento-invalido-error.js"

export class Placa {
  private readonly valor: string

  private constructor(valor: string) {
    this.valor = valor
  }

  /**
   * Remove hífens, espaços e caracteres especiais, deixando apenas letras e números em maiúsculas
   */
  private static normalizar(placa: string): string {
    if (!placa) return ''
    return placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
  }

  /**
   * Valida se a placa limpa atende ao padrão antigo ou ao padrão Mercosul
   */
  public static validar(placaBruta: string): boolean {
    const placaLimpa = this.normalizar(placaBruta)

    // Regex 1: ^[A-Z]{3}[0-9]{4}$       -> Padrão Antigo (Ex: ABC1234)
    // Regex 2: ^[A-Z]{3}[0-9][A-Z][0-9]{2}$ -> Padrão Mercosul (Ex: ABC1D23)
    const placaRegex = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/

    return placaRegex.test(placaLimpa)
  }

  public static criar(placa: string): Placa {
    if (!Placa.validar(placa)) {
      throw new ArgumentoInvalidoError('Placa com formato inválido para o cadastro do veículo.')
    }

    // Armazena sempre a versão limpa e padronizada no banco (Ex: "ABC1234" ou "ABC1D23")
    return new Placa(this.normalizar(placa))
  }

  public getValor(): string {
    return this.valor
  }

  /**
   * Opcional: Retorna a placa formatada visualmente se for o padrão antigo
   * (Ajuda a manter a interface amigável se o cliente tiver um carro antigo)
   */
  public getFormatada(): string {
    // Se tiver 4 números no final, coloca o hífen clássico (Padrão Antigo)
    if (/^[A-Z]{3}\d{4}$/.test(this.valor)) {
      return `${this.valor.substring(0, 3)}-${this.valor.substring(3)}`
    }
    // Se for Mercosul, retorna ela junta conforme o padrão oficial
    return this.valor
  }

  public equals(other: Placa): boolean {
    return this.valor === other.getValor()
  }
}