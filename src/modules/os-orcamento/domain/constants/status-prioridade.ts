import { StatusOS } from "../entities/ordem-servico.js"

export const PRIORIDADE_STATUS: Record<string, number> = {
  EM_EXECUCAO: 1,
  AGUARDANDO_APROVACAO: 2,
  DIAGNOSTICO: 3,
  RECEBIDA: 4,
  AUTORIZADA: 5,
  PRONTA_PARA_INICIAR: 6,
  FINALIZADA: 7,
} as const

export const STATUS_FINALIZADOS: StatusOS[] = [
  'ENTREGUE',
  'ENCERRADA_REJEICAO',
  'ENCERRADA'
] as const