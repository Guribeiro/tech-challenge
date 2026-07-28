// src/infra/http/errors/domain-error-map.ts
import { HttpStatus, Type } from '@nestjs/common'

// Importe seus erros de aplicação/domínio
import { CredenciaisInvalidasError } from '@/core/errors/credenciais-invalidas-error.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { CpfJaCadastradoError } from '@/core/errors/cpf-ja-cadastrado.js'


export const DOMAIN_ERROR_MAP = new Map<Type<Error>, HttpStatus>([
  [CredenciaisInvalidasError, HttpStatus.UNAUTHORIZED],        // 401
  [EmailJaCadastradoError, HttpStatus.CONFLICT], // 409
  [CpfJaCadastradoError, HttpStatus.CONFLICT],   // 409
  // Adicione novos erros aqui conforme sua aplicação cresce...
])