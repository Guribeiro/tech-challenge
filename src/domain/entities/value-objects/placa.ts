export class Placa {
  private readonly valor: string

  private constructor(valor: string) {
    this.valor = valor.toUpperCase().replace(/[^A-Z0-9]/g, '')
  }

  public static validar(placa: string): boolean {
    const placaRegex = /^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/i
    return Boolean(placa && placaRegex.test(placa))
  }

  public static criar(placa: string): Placa {
    if (!Placa.validar(placa)) {
      throw new Error('Placa com formato inválido para o cadastro do veículo.')
    }

    return new Placa(placa)
  }

  public getValor(): string {
    return this.valor
  }

  public equals(other: Placa): boolean {
    return this.valor === other.getValor();
  }
}
