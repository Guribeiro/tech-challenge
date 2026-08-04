export type PaginationParams = {
  pagina: number
  limite: number
}

export type PaginationResult = {
  total: number
  pagina: number
  limite: number
}
export type QueryStatus = 'ativos' | 'deletados' | 'todos'