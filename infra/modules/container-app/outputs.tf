output "container_app_name" {
  description = "Name of the backend Container App."
  value       = azurerm_container_app.backend.name
}

output "container_app_id" {
  description = "Resource ID of the backend Container App."
  value       = azurerm_container_app.backend.id
}

output "container_app_fqdn" {
  description = "Public FQDN of the backend Container App's latest revision."
  value       = azurerm_container_app.backend.latest_revision_fqdn
}

output "container_app_identity_principal_id" {
  description = "Principal ID of the Container App's user-assigned managed identity."
  value       = azurerm_user_assigned_identity.container_app.principal_id
}
