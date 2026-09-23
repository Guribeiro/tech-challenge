resource "kubernetes_secret_v1" "postgres_secret" {
  metadata {
    name      = "oficina-db-secret"
    namespace = var.namespace
  }

  data = {
    POSTGRES_USER     = var.db_user
    POSTGRES_PASSWORD = var.db_password
    POSTGRES_DB       = var.db_name
  }
}

resource "kubernetes_deployment_v1" "postgres" {
  metadata {
    name      = "postgres-deployment"
    namespace = var.namespace
  }

  spec {
    replicas = 1
    selector {
      match_labels = { app = "postgres" }
    }
    template {
      metadata {
        labels = { app = "postgres" }
      }
      spec {
        container {
          image = "postgres:16-alpine"
          name  = "postgres"
          port { container_port = 5432 }

          env {
            name = "POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.postgres_secret.metadata[0].name
                key  = "POSTGRES_USER"
              }
            }
          }
          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.postgres_secret.metadata[0].name
                key  = "POSTGRES_PASSWORD"
              }
            }
          }
          env {
            name = "POSTGRES_DB"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.postgres_secret.metadata[0].name
                key  = "POSTGRES_DB"
              }
            }
          }

          resources {
            limits   = { cpu = "500m", memory = "512Mi" }
            requests = { cpu = "200m", memory = "256Mi" }
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "postgres_service" {
  metadata {
    name      = "postgres-service"
    namespace = var.namespace
  }
  spec {
    selector = { app = "postgres" }
    port {
      port        = 5432
      target_port = 5432
    }
    type = "ClusterIP"
  }
}