output "cluster_name" {
  value       = module.cluster.cluster_name
  description = "Nome do cluster Kubernetes criado via Kind"
}

output "kubeconfig_path" {
  value       = module.cluster.kubeconfig_path
  description = "Caminho do arquivo kubeconfig gerado"
}