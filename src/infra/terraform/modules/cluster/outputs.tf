output "cluster_name" {
  value = kind_cluster.oficina_cluster.name
}

output "endpoint" {
  value = kind_cluster.oficina_cluster.endpoint
}

output "client_certificate" {
  value = kind_cluster.oficina_cluster.client_certificate
}

output "client_key" {
  value = kind_cluster.oficina_cluster.client_key
}

output "cluster_ca_certificate" {
  value = kind_cluster.oficina_cluster.cluster_ca_certificate
}

output "kubeconfig_path" {
  value = kind_cluster.oficina_cluster.kubeconfig_path
}