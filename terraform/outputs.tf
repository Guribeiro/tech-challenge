output "cluster_name" {
  value       = kind_cluster.oficina_cluster.name
  description = "Nome do cluster Kubernetes criado via Kind"
}

output "kubeconfig_path" {
  value       = kind_cluster.oficina_cluster.kubeconfig_path
  description = "Caminho do arquivo kubeconfig gerado"
}