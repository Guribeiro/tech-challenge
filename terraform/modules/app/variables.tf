variable "namespace" { type = string }
variable "db_user" { type = string }
variable "db_password" { type = string }
variable "db_name" { type = string }
variable "db_service_name" { type = string }
variable "app_image" {
  type    = string
  default = "guribeiro/oficina-app:v1.0.2"
}