resource "azurerm_log_analytics_workspace" "main" {
  name                = var.log_analytics_workspace_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Project     = "team7"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "azurerm_container_app_environment" "main" {
  name                       = var.container_app_environment_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Project     = "team7"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
