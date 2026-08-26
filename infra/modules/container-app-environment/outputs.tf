output "container_app_environment_name" {
  description = "Name of the shared Container Apps Environment."
  value       = azurerm_container_app_environment.main.name
}

output "container_app_environment_id" {
  description = "Resource ID of the shared Container Apps Environment."
  value       = azurerm_container_app_environment.main.id
}

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics Workspace."
  value       = azurerm_log_analytics_workspace.main.name
}

output "log_analytics_workspace_id" {
  description = "Resource ID of the Log Analytics Workspace."
  value       = azurerm_log_analytics_workspace.main.id
}
