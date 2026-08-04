// src/infra/http/presenters/http-presenter.ts
import { Either } from '@/core/either.js'
import { UseCaseError } from '@/core/errors/use-case-error.js'
import { DomainHttpException } from '../errors/domain-http-exception.js'

export function unwrapEither<L extends UseCaseError, R>(result: Either<L, R>): R {
  if (result.isLeft()) {
    throw new DomainHttpException(result.value)
  }

  return result.value
}