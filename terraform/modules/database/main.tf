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
            name  = "POSTGRES_USER"
            value = var.db_user
          }
          env {
            name  = "POSTGRES_PASSWORD"
            value = var.db_password
          }
          env {
            name  = "POSTGRES_DB"
            value = var.db_name
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