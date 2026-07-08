import { randomUUID } from "node:crypto";

export class UniqueEntityID {
  private readonly value: string;

  toValue(): string {
    return this.value;
  }

  constructor(value?: string) {
    this.value = value ?? randomUUID();
  }
}