module "cluster" {
  source       = "./modules/cluster"
  cluster_name = "oficina-cluster"
}

resource "kubernetes_namespace_v1" "oficina_namespace" {
  metadata {
    name = "oficina-mecanica"
  }
  depends_on = [module.cluster]
}

module "database" {
  source    = "./modules/database"
  namespace = kubernetes_namespace_v1.oficina_namespace.metadata[0].name

  db_user     = var.db_user
  db_password = var.db_password
  db_name     = var.db_name
}

module "app" {
  source    = "./modules/app"
  namespace = kubernetes_namespace_v1.oficina_namespace.metadata[0].name

  db_user         = var.db_user
  db_password     = var.db_password
  db_name         = var.db_name
  db_service_name = module.database.db_service_name

  depends_on = [module.database]
}