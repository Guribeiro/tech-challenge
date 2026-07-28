import { UseCaseError } from "./use-case-error.js";

export class CredenciaisInvalidasError extends Error implements UseCaseError {
  constructor() {
    super('E-mail ou senha incorretos.')
  }
}