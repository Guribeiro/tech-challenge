import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/index.js'
import { Cpf } from './cpf.js'
import { Cnpj } from './cnpj.js'

export class CpfCnpj {
  private readonly valor: string
  private readonly tipo: 'PF' | 'PJ'

  private constructor(valor: string, tipo: 'PF' | 'PJ') {
    this.valor = valor
    this.tipo = tipo
  }

  public static criar(documentoBruto: string): CpfCnpj {
    if (!documentoBruto) {
      throw new ArgumentoInvalidoError('Documento (CPF/CNPJ) é obrigatório.')
    }

    const limpo = documentoBruto.replace(/\D/g, '')

    if (limpo.length === 11) {
      const cpf = Cpf.criar(limpo)
      return new CpfCnpj(cpf.getValor(), 'PF')
    }

    if (limpo.length === 14) {
      const cnpj = Cnpj.criar(limpo)
      return new CpfCnpj(cnpj.getValor(), 'PJ')
    }

    throw new ArgumentoInvalidoError('Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
  }

  public getValor(): string {
    return this.valor
  }

  public getTipo(): 'PF' | 'PJ' {
    return this.tipo
  }

  public getFormatado(): string {
    if (this.tipo === 'PF') {
      return this.valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return this.valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
}