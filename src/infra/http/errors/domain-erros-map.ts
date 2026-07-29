// src/infra/http/errors/domain-error-map.ts
import { HttpStatus, Type } from '@nestjs/common'

import { CredenciaisInvalidasError } from '@/core/errors/credenciais-invalidas-error.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { CpfJaCadastradoError } from '@/core/errors/cpf-ja-cadastrado.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'

export const DOMAIN_ERROR_MAP = new Map<Type<Error>, HttpStatus>([
  [CredenciaisInvalidasError, HttpStatus.UNAUTHORIZED],
  [EmailJaCadastradoError, HttpStatus.CONFLICT],
  [CpfJaCadastradoError, HttpStatus.CONFLICT],
  [RecursoNaoEncontradoError, HttpStatus.NOT_FOUND],
])