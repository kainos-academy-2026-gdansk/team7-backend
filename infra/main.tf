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

  container_app_name           = var.container_app_name
  resource_group_name          = module.resource_group.name
  location                     = module.resource_group.location
  environment                  = var.environment
  container_app_environment_id = module.container_app_environment.container_app_environment_id

  container_registry_login_server = data.azurerm_container_registry.backend.login_server
  container_registry_id           = data.azurerm_container_registry.backend.id
  container_image                 = var.container_image

  key_vault_id = module.key_vault.id
  database_url = var.database_url
  jwt_secret   = var.jwt_secret

  target_port              = var.target_port
  ingress_external_enabled = var.ingress_external_enabled
  container_cpu            = var.container_cpu
  container_memory         = var.container_memory
  min_replicas             = var.min_replicas
  max_replicas             = var.max_replicas
}
