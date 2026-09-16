terraform {
  required_version = ">= 1.0.0"

  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.32.0"
    }
  }
}

provider "kind" {}

provider "kubernetes" {
  host                   = kind_cluster.oficina_cluster.endpoint
  client_certificate     = kind_cluster.oficina_cluster.client_certificate
  client_key             = kind_cluster.oficina_cluster.client_key
  cluster_ca_certificate = kind_cluster.oficina_cluster.cluster_ca_certificate
}