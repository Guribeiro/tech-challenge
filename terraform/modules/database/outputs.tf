output "db_service_name" {
  value = kubernetes_service_v1.postgres_service.metadata[0].name
}