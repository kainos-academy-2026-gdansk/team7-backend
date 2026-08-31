ephemeral "azurerm_key_vault_secret" "administrator_password" {
  name         = var.administrator_password_secret_name
  key_vault_id = var.key_vault_id
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.server_name
  resource_group_name = var.resource_group_name
  location            = var.location
  zone                = var.zone

  version                           = var.postgresql_version
  administrator_login               = var.administrator_login
  administrator_password_wo         = ephemeral.azurerm_key_vault_secret.administrator_password.value
  administrator_password_wo_version = var.administrator_password_version
  sku_name                          = var.sku_name
  storage_mb                        = var.storage_mb
  storage_tier                      = var.storage_tier
  auto_grow_enabled                 = false
  backup_retention_days             = 7
  geo_redundant_backup_enabled      = false
  public_network_access_enabled     = true

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }

  tags = {
    Project     = "team7-backend"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "azurerm_postgresql_flexible_server_database" "application" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
