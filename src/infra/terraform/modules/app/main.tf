resource "kubernetes_secret_v1" "app_secret" {
  metadata {
    name      = "oficina-app-secret"
    namespace = var.namespace
  }

  data = {
    DATABASE_URL = "postgresql://${var.db_user}:${var.db_password}@${var.db_service_name}:5432/${var.db_name}?schema=public"
  }
}

resource "kubernetes_deployment_v1" "oficina_app" {
  metadata {
    name      = "oficina-app-deployment"
    namespace = var.namespace
  }

  spec {
    replicas = 2
    selector { match_labels = { app = "oficina-app" } }

    template {
      metadata { labels = { app = "oficina-app" } }
      spec {
        init_container {
          name              = "prisma-migration"
          image             = var.app_image
          image_pull_policy = "Always"
          command           = ["sh", "-c", "npx prisma migrate deploy"]

          env_from {
            secret_ref {
              name = kubernetes_secret_v1.app_secret.metadata[0].name
            }
          }
        }
        container {
          name              = "oficina-app"
          image             = var.app_image
          image_pull_policy = "Always"

          port { container_port = 3000 }

          env {
            name = "DATABASE_URL"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.app_secret.metadata[0].name
                key  = "DATABASE_URL"
              }
            }
          }

          resources {
            requests = { cpu = "100m", memory = "128Mi" }
            limits   = { cpu = "500m", memory = "512Mi" }
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 15
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "oficina_app_service" {
  metadata {
    name      = "oficina-service"
    namespace = var.namespace
  }
  spec {
    selector = { app = "oficina-app" }
    port {
      port        = 3000
      target_port = 3000
      node_port   = 30000
    }
    type = "NodePort"
  }
}

resource "kubernetes_horizontal_pod_autoscaler_v2" "oficina_app_hpa" {
  metadata {
    name      = "oficina-app-hpa"
    namespace = var.namespace
  }
  spec {
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment_v1.oficina_app.metadata[0].name
    }
    min_replicas = 2
    max_replicas = 5

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 70
        }
      }
    }

    # Adicionado para monitorar e escalar também por consumo de memória
    metric {
      type = "Resource"
      resource {
        name = "memory"
        target {
          type                = "Utilization"
          average_utilization = 80
        }
      }
    }
  }
}