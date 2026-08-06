import { ApiProperty } from '@nestjs/swagger'
import { MetaPaginacaoResponseDto } from '@/infra/http/dto/meta-paginacao-response.dto.js'
import { NotificacaoResponseDto } from './notificacao-response.dto.js'

export class ListarNotificacoesDestinatarioResponseDto {
  @ApiProperty({
    description: 'Lista de notificações retornadas pelo destinatário autenticado',
    type: [NotificacaoResponseDto],
  })
  notificacoes!: NotificacaoResponseDto[]

  @ApiProperty({
    description: 'Metadados de paginação da resposta',
    type: MetaPaginacaoResponseDto,
  })
  meta!: MetaPaginacaoResponseDto
}
