import { faker } from "@faker-js/faker";

import { Notificacao, NotificacaoProps } from "@/modules/notificacoes/domain/entities/notificacao.js";
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js";

export function makeNotificacao(
  override: Partial<NotificacaoProps> = {},
  id?: UniqueEntityID
): Notificacao {
  const notificacao = Notificacao.create(
    {
      destinatarioId: new UniqueEntityID(),
      titulo: faker.lorem.sentence({ min: 3, max: 5 }),
      conteudo: faker.lorem.sentence(),
      ...override,
    },
    id
  )

  return notificacao
}