variable "db_user" {
  description = "Usuário do banco de dados PostgreSQL"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Senha do banco de dados PostgreSQL"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_name" {
  description = "Nome do banco de dados da oficina"
  type        = string
  default     = "oficina_db"
}