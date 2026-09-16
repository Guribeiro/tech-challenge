# 1. Cria o Cluster Kubernetes local via Kind
resource "kind_cluster" "oficina_cluster" {
  name           = "oficina-cluster"
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"
      
      # Mapeia a porta 30000 do K8s para o seu localhost (para acessar o NestJS depois)
      extra_port_mappings {
        container_port = 30000
        host_port      = 30000
        protocol       = "TCP"
      }
    }
  }
}

# 2. Cria o Namespace isolado
resource "kubernetes_namespace" "oficina_namespace" {
  metadata {
    name = "oficina-mecanica"
  }
  depends_on = [kind_cluster.oficina_cluster]
}

# 3. Provisiona o Deployment do PostgreSQL
resource "kubernetes_deployment" "postgres" {
  metadata {
    name      = "postgres-deployment"
    namespace = kubernetes_namespace.oficina_namespace.metadata[0].name
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "postgres"
      }
    }
    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }
      spec {
        container {
          image = "postgres:16-alpine"
          name  = "postgres"
          port {
            container_port = 5432
          }
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
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
            requests = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }
}

# 4. Cria o Service do PostgreSQL para comunicação interna
resource "kubernetes_service" "postgres_service" {
  metadata {
    name      = "postgres-service"
    namespace = kubernetes_namespace.oficina_namespace.metadata[0].name
  }
  spec {
    selector = {
      app = "postgres"
    }
    port {
      port        = 5432
      target_port = 5432
    }
    type = "ClusterIP"
  }
}