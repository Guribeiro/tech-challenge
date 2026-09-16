variable "db_user" {
  type        = string
  description = "Usuário do banco de dados PostgreSQL"
}

variable "db_password" {
  type        = string
  description = "Senha do banco de dados PostgreSQL"
  sensitive   = true
}

variable "db_name" {
  type        = string
  description = "Nome do banco de dados da oficina"
}

variable "kube_context" {
  type        = string
  description = "Nome do contexto do Kubernetes no ~/.kube/config"
}

variable "namespace" {
  type        = string
  description = "Namespace para isolamento dos recursos"
}