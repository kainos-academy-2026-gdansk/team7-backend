data "azurerm_client_config" "current" {}

data "azurerm_container_registry" "backend" {
  name                = var.container_registry_name
  resource_group_name = var.container_registry_resource_group_name
}

module "resource_group" {
  source = "./modules/resource-group"

  name        = var.resource_group_name
  location    = var.location
  environment = var.environment
}

module "key_vault" {
  source = "./modules/key-vault"

  name                = var.key_vault_name
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  environment         = var.environment
}

module "postgresql" {
  source = "./modules/postgresql-flexible-server"

  server_name         = var.postgresql_server_name
  database_name       = var.postgresql_database_name
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  environment         = var.environment

  key_vault_id                       = module.key_vault.id
  administrator_login                = var.postgresql_administrator_login
  administrator_password_secret_name = var.postgresql_administrator_password_secret_name
  administrator_password_version     = var.postgresql_administrator_password_version

  postgresql_version = var.postgresql_version
  sku_name           = var.postgresql_sku_name
  storage_mb         = var.postgresql_storage_mb
  storage_tier       = var.postgresql_storage_tier
}

module "container_app_environment" {
  source = "./modules/container-app-environment"

  container_app_environment_name = var.container_app_environment_name
  log_analytics_workspace_name   = var.log_analytics_workspace_name
  resource_group_name            = module.resource_group.name
  location                       = module.resource_group.location
  environment                    = var.environment
}

module "backend_container_app" {
  source = "./modules/container-app"

  depends_on = [module.postgresql]

  container_app_name           = var.container_app_name
  resource_group_name          = module.resource_group.name
  location                     = module.resource_group.location
  environment                  = var.environment
  container_app_environment_id = module.container_app_environment.container_app_environment_id

  container_registry_login_server = data.azurerm_container_registry.backend.login_server
  container_registry_id           = data.azurerm_container_registry.backend.id
  container_image                 = var.container_image

  key_vault_id  = module.key_vault.id
  key_vault_uri = module.key_vault.uri

  target_port              = var.target_port
  ingress_external_enabled = var.ingress_external_enabled
  container_cpu            = var.container_cpu
  container_memory         = var.container_memory
  min_replicas             = var.min_replicas
  max_replicas             = var.max_replicas
}
