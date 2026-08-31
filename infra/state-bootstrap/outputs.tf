output "storage_account_name" {
  description = "Name of the Storage Account used for Terraform remote state."
  value       = azurerm_storage_account.terraform_state.name
}

output "storage_account_id" {
  description = "Resource ID of the Storage Account used for Terraform remote state."
  value       = azurerm_storage_account.terraform_state.id
}

output "container_name" {
  description = "Name of the private Blob container used for Terraform remote state."
  value       = azurerm_storage_container.terraform_state.name
}