# ADR 0006 — Segredos do Secrets Manager no Kubernetes e rollout por checksum

- **Status:** aceito
- **Data:** 2026-11-14

## Contexto

A API precisa da URL do banco, do segredo JWT e da license key do New Relic. Os valores nascem
no Terraform (`oficina-infra-db`) e no GitHub (license), ficam no **Secrets Manager** e não
podem ser versionados. O Learner Lab não permite criar roles IAM, o que inviabiliza IRSA e o
External Secrets Operator / Secrets Store CSI Driver com credenciais próprias do pod.

Em hml, a license key do New Relic foi adicionada ao Secret, mas os pods continuaram sem ela:
com a mesma imagem e os mesmos manifests, o Deployment não gerou rollout, e os pods só leem o
Secret ao iniciar.

## Decisão

- O `scripts/deploy.sh`, executado pela pipeline com as credenciais do ambiente, lê
  `oficina/<env>/db` e `oficina/<env>/jwt` do Secrets Manager e cria o Secret
  `oficina-app-secret` no namespace (os valores nunca são impressos nem gravados no Git).
- Após aplicar os manifests, o script grava no template dos pods a anotação
  **`oficina/secret-checksum`** com o hash do Secret. Se o Secret mudou, o template muda e o
  Kubernetes faz o rollout; se não mudou, nada acontece.

## Consequências

- Rotação de senha do banco, do segredo JWT ou da license chega aos pods no próximo deploy, sem
  `rollout restart` manual.
- Os segredos ficam em texto no etcd do EKS (criptografado em repouso pela AWS) e acessíveis a
  quem lê Secrets no namespace; o acesso ao cluster é restrito à role do laboratório.
- Fora do Learner Lab, a evolução é o External Secrets Operator com IRSA, que sincroniza e
  rotaciona os valores sem passar pela pipeline.
