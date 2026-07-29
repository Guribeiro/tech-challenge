import { ArgumentoInvalidoError } from "@/core/errors/domain-errors/argumento-invalido-error.js"

export class Telefone {
  private readonly valor: string

  private constructor(valor: string) {
    this.valor = valor
  }

  /**
   * Factory Method (Método de Fabricação)
   */
  public static criar(numero: string): Telefone {
    if (!numero) {
      throw new ArgumentoInvalidoError('O número de telefone não pode estar vazio.')
    }

    // Remove qualquer caractere não numérico (parênteses, hifens, espaços)
    const apenasNumeros = numero.replace(/\D/g, '')

    // Executa a validação do formato limpo
    this.validar(apenasNumeros)

    return new Telefone(apenasNumeros)
  }

  /**
   * Método privado isolado para aplicar as regras de negócio de telefonia brasileira
   */
  private static validar(numeroLimpo: string): void {
    // Regra 1: Deve ter 10 dígitos (fixo) ou 11 dígitos (celular), incluindo o DDD
    if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
      throw new ArgumentoInvalidoError(
        'O telefone deve conter um DDD válido seguido de 8 ou 9 dígitos.',
      )
    }

    // Regra 2: Impedir números falsos repetidos comuns (ex: 1111111111, 00000000000)
    const todosDigitosIguais = /^(.)\1+$/
    if (todosDigitosIguais.test(numeroLimpo)) {
      throw new ArgumentoInvalidoError('Número de telefone inválido (padrão repetitivo).')
    }

    // Regra 3: Validar os primeiros dígitos do DDD (Não existem DDDs começando com 0 ou menores que 11)
    const ddd = parseInt(numeroLimpo.substring(0, 2), 10)
    if (ddd < 11 || ddd > 99) {
      throw new ArgumentoInvalidoError('O código de área (DDD) informado é inválido.')
    }

    // Regra 4: Se for celular (11 dígitos), obrigatoriamente deve começar com o dígito 9
    if (numeroLimpo.length === 11 && numeroLimpo.charAt(2) !== '9') {
      throw new ArgumentoInvalidoError(
        'Números de celular com 11 dígitos devem iniciar com o dígito 9 após o DDD.',
      )
    }
  }

  public getValor(): string {
    return this.valor
  }

  /**
   * Método auxiliar para retornar o telefone mascarado no formato (XX) XXXXX-XXXX para as respostas da API Express
   */
  public getValorFormatado(): string {
    if (this.valor.length === 11) {
      return `(${this.valor.substring(0, 2)}) ${this.valor.substring(2, 7)}-${this.valor.substring(7)}`
    }
    return `(${this.valor.substring(0, 2)}) ${this.valor.substring(2, 6)}-${this.valor.substring(6)}`
  }

  public equals(outroTelefone: Telefone): boolean {
    return this.valor === outroTelefone.getValor()
  }
}
