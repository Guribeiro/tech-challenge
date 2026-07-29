// src/infra/http/errors/domain-error-map.ts
import {
  CpfJaCadastradoError,
  CredenciaisInvalidasError,
  EmailJaCadastradoError,
  RecursoNaoEncontradoError,
  PlacaJaCadastradaError,
  ServicoJaCadastradoError,
  CodigoSKUJaCadastradoError,
  ProdutoJaCadastradoError,
  AcessoNegadoError
} from '@/core/errors/index.js'
import { HttpStatus, Type } from '@nestjs/common'



export const DOMAIN_ERROR_MAP = new Map<Type<Error>, HttpStatus>([
  [CredenciaisInvalidasError, HttpStatus.UNAUTHORIZED],
  [AcessoNegadoError, HttpStatus.FORBIDDEN],
  [EmailJaCadastradoError, HttpStatus.CONFLICT],
  [CpfJaCadastradoError, HttpStatus.CONFLICT],
  [PlacaJaCadastradaError, HttpStatus.CONFLICT],
  [ServicoJaCadastradoError, HttpStatus.CONFLICT],
  [CodigoSKUJaCadastradoError, HttpStatus.CONFLICT],
  [ProdutoJaCadastradoError, HttpStatus.CONFLICT],
  [RecursoNaoEncontradoError, HttpStatus.NOT_FOUND],
])