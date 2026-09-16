import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/index.js'

export class Cnpj {
  private readonly valor: string

  private constructor(valor: string) {
    this.valor = valor
  }

  public static criar(cnpjBruto: string): Cnpj {
    const cnpjLimpo = this.limpar(cnpjBruto)

    if (!this.validar(cnpjLimpo)) {
      throw new ArgumentoInvalidoError('CNPJ informado é inválido.')
    }

    return new Cnpj(cnpjLimpo)
  }

  public getValor(): string {
    return this.valor
  }

  public getFormatado(): string {
    return this.valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  private static limpar(cnpj: string): string {
    return cnpj.replace(/\D/g, '')
  }

  private static validar(cnpj: string): boolean {
    if (cnpj.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cnpj)) return false

    let tamanho = cnpj.length - 2
    let numeros = cnpj.substring(0, tamanho)
    const digitos = cnpj.substring(tamanho)
    let soma = 0
    let pos = tamanho - 7

    for (let i = tamanho; i >= 1; i--) {
      soma += Number.parseInt(numeros.charAt(tamanho - i)) * pos--
      if (pos < 2) pos = 9
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    if (resultado !== Number.parseInt(digitos.charAt(0))) return false

    tamanho = tamanho + 1
    numeros = cnpj.substring(0, tamanho)
    soma = 0
    pos = tamanho - 7

    for (let i = tamanho; i >= 1; i--) {
      soma += Number.parseInt(numeros.charAt(tamanho - i)) * pos--
      if (pos < 2) pos = 9
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    if (resultado !== Number.parseInt(digitos.charAt(1))) return false

    return true
  }
}