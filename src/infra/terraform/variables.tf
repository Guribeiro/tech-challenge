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

variable "namespace" {
  type        = string
  description = "Namespace para isolamento dos recursos"
}

variable "app_image" {
  type        = string
  description = "Imagem Docker da API a ser publicada no cluster"
  default     = "guribeiro/oficina-app:v1.0.2"
}