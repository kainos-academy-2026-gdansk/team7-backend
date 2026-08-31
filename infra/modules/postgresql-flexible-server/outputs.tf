output "id" {
  description = "Resource ID of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.main.id
}

output "name" {
  description = "Name of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.main.name
}

output "fqdn" {
  description = "FQDN of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "Name of the application database."
  value       = azurerm_postgresql_flexible_server_database.application.name
}

output "administrator_login" {
  description = "Administrator login used by the PostgreSQL server."
  value       = azurerm_postgresql_flexible_server.main.administrator_login
}
