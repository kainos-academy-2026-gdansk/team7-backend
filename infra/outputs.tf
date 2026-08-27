output "resource_group_id" {
  description = "Resource ID of the created Resource Group."
  value       = module.resource_group.id
}

output "resource_group_name" {
  description = "Name of the created Resource Group."
  value       = module.resource_group.name
}

output "resource_group_location" {
  description = "Azure location of the Resource Group."
  value       = module.resource_group.location
}

output "key_vault_name" {
  description = "Name of the Key Vault."
  value       = module.key_vault.name
}

output "key_vault_id" {
  description = "Resource ID of the Key Vault."
  value       = module.key_vault.id
}

output "key_vault_uri" {
  description = "URI of the Key Vault."
  value       = module.key_vault.uri
}

output "container_app_environment_name" {
  description = "Name of the shared Container Apps Environment."
  value       = module.container_app_environment.container_app_environment_name
}

output "container_app_environment_id" {
  description = "Resource ID of the shared Container Apps Environment."
  value       = module.container_app_environment.container_app_environment_id
}

output "log_analytics_workspace_name" {
  description = "Name of the shared Log Analytics Workspace."
  value       = module.container_app_environment.log_analytics_workspace_name
}

output "log_analytics_workspace_id" {
  description = "Resource ID of the shared Log Analytics Workspace."
  value       = module.container_app_environment.log_analytics_workspace_id
}

output "acr_login_server" {
  description = "Login server of the existing Azure Container Registry."
  value       = data.azurerm_container_registry.backend.login_server
}

output "backend_container_app_name" {
  description = "Name of the backend Container App."
  value       = module.backend_container_app.container_app_name
}

output "backend_container_app_fqdn" {
  description = "Public FQDN of the backend Container App."
  value       = module.backend_container_app.container_app_fqdn
}

output "backend_container_app_identity_principal_id" {
  description = "Principal ID of the backend Container App's user-assigned managed identity."
  value       = module.backend_container_app.container_app_identity_principal_id
}
