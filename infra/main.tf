data "azurerm_client_config" "current" {}

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
