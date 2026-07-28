// src/infra/http/errors/domain-http-exception.ts
import { HttpException, HttpStatus } from '@nestjs/common'
import { UseCaseError } from '@/core/errors/use-case-error.js'
import { DOMAIN_ERROR_MAP } from './domain-erros-map.js'

export class DomainHttpException extends HttpException {
  constructor(error: UseCaseError) {
    const errorClass = error.constructor as new (...args: any[]) => Error

    // Procura o status no mapa. Se não achar, usa 400 (Bad Request) por padrão
    const status = DOMAIN_ERROR_MAP.get(errorClass) ?? HttpStatus.BAD_REQUEST

    super(
      {
        statusCode: status,
        message: error.message,
        error: errorClass.name,
      },
      status,
    )
  }
}