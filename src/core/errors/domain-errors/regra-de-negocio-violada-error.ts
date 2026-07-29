import { DomainError } from "./domain-error.js"

export class RegraDeNegocioVioladaError extends Error implements DomainError { }