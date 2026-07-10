import { randomUUID } from 'node:crypto'

export class UniqueEntityID {
  private readonly value: string

  toValue(): string {
    return this.value
  }

  equals(otherValue: UniqueEntityID): boolean {
    return this.value === otherValue.toValue()
  }

  constructor(value?: string) {
    this.value = value ?? randomUUID()
  }
}
