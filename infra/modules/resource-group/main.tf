resource "azurerm_resource_group" "main" {
  name     = var.name
  location = var.location

  tags = {
    Project     = "team7-backend"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}