export class Cpf {
  private readonly valor: string

  private constructor(valor: string) {
    this.valor = valor
  }

  public static criar(cpfBruto: string): Cpf {
    const cpfLimpo = this.limpar(cpfBruto)

    if (!this.validar(cpfLimpo)) {
      throw new Error('CPF informado é inválido.')
    }

    return new Cpf(cpfLimpo)
  }

  public getValor(): string {
    return this.valor
  }

  public getFormatado(): string {
    return this.valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  private static limpar(cpf: string): string {
    return cpf.replace(/\D/g, '')
  }

  private static validar(cpf: string): boolean {
    if (cpf.length !== 11) return false

    // Bloqueia CPFs com todos os números iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) return false

    // Validação do primeiro dígito verificador
    let soma = 0
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let resto = 11 - (soma % 11)
    let digitoVerificador1 = resto > 9 ? 0 : resto
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false

    // Validação do segundo dígito verificador
    soma = 0
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i)
    }
    resto = 11 - (soma % 11)
    let digitoVerificador2 = resto > 9 ? 0 : resto
    if (parseInt(cpf.charAt(10)) !== digitoVerificador2) return false

    return true
  }
}