import { ArgumentoInvalidoError } from "@/core/errors/domain-errors/argumento-invalido-error.js"

export class Email {
  private readonly valor: string

  private constructor(email: string) {
    this.valor = email.toLowerCase()
  }

  public static criar(email: string): Email {
    if (!Email.validar(email)) {
      throw new ArgumentoInvalidoError('Email inválido')
    }
    return new Email(email)
  }

  public static validar(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  public getValor(): string {
    return this.valor
  }

  public equals(other: Email): boolean {
    return this.valor === other.valor
  }
}
