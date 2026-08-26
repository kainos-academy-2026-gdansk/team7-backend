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
