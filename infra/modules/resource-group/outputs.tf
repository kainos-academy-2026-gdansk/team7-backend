output "name" {
  description = "Name of the Resource Group."
  value       = azurerm_resource_group.main.name
}

output "id" {
  description = "Resource ID of the Resource Group."
  value       = azurerm_resource_group.main.id
}

output "location" {
  description = "Azure location of the Resource Group."
  value       = azurerm_resource_group.main.location
}