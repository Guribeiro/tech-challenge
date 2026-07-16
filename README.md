# TODO List - Sistema de Ordem de Serviço

## 📋 Gestão de Ordem de Serviço
- [x] Criar ordem de serviço
- [x] Priorizar OS na fila de acordo com aspectos da OS
- [x] Atualizar status da OS para Aprovado (quando cliente aprovar orçamento)
- [x] Atualizar status da OS para PRONTA_PARA_INICIAR (quando produtos reservados)
- [x] Atualizar status da OS para EM_EXECUCAO (quando iniciar execução)
- [x] Encerrar OS por rejeição (quando cliente recusar orçamento renegociado)

## 🔧 Diagnóstico e Orçamento
- [x] Iniciar diagnóstico do veículo na OS
- [x] Notificar cliente sobre início da inspeção
- [x] Concluir diagnóstico técnico do veículo
- [x] Notificar cliente sobre conclusão do diagnóstico
- [x] Gerar orçamento automaticamente após diagnóstico concluído
- [x] Enviar orçamento para o cliente
- [x] Enviar notificação com orçamento

## ✅ Aprovação de Orçamento
- [ ] Aprovar orçamento (cliente)
- [x] Recusar orçamento (cliente)
- [x] Renegociar orçamento (recepcionista)
- [x] Recusar orçamento renegociado (cliente)
- [x] Notificar recepcionista para renegociação (quando cliente recusar)

## 🔨 Execução do Serviço
- [x] Iniciar execução da OS
- [x] Notificar cliente quando status mudar para EM_EXECUCAO
- [ ] Finalizar ordem de serviço
- [ ] Deduzir produtos do estoque após finalização da OS

## 📦 Gestão de Estoque e Inventário
- [x] Reservar produtos para a OS
- [ ] Deduzir quantidade do estoque
- [ ] Verificar estoque mínimo e solicitar compra de reposição
- [ ] Criar ordem de compra
- [ ] Dar entrada em nota fiscal de compra
- [ ] Incrementar quantidade de itens no inventário

## 💰 Faturamento e Pagamento
- [ ] Gerar faturamento após finalização da OS
- [ ] Emitir fatura de pagamento
- [ ] Notificar cliente quando fatura for emitida
- [ ] Efetuar pagamento (cliente)
- [ ] Liberar veículo para entrega após pagamento realizado

## 📄 Liberação e Entrega
- [ ] Emitir termo de liberação
- [ ] Notificar recepção para entrega física após termo emitido
- [x] Emitir termo de liberação por rejeição
- [x] Gerar documento de recusa e liberação de pátio
- [x] Notificar cliente para retirada do veículo (caso rejeição)

## 🔔 Sistema de Notificações
- [x] Enviar notificação de início de serviço
- [x] Enviar notificação de diagnóstico concluído
- [x] Enviar notificação de orçamento
- [ ] Enviar notificação de fatura emitida
- [x] Enviar notificação de status EM_EXECUCAO
- [x] Enviar notificação para retirada (rejeição)

## 📊 Listas e Visualizações
- [x] Lista de OS priorizadas (para mecânico)
- [x] Lista de OS com status PRONTA_PARA_INICIAR (para mecânico)

---
**Legenda:**
- [ ] Não implementado
- [x] Implementado
- [⚠] Em andamento
- [🔄] Em revisão
