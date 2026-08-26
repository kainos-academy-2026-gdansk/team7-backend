output "name" {
  description = "Name of the Key Vault."
  value       = azurerm_key_vault.main.name
}

output "id" {
  description = "Resource ID of the Key Vault."
  value       = azurerm_key_vault.main.id
}

output "uri" {
  description = "URI of the Key Vault."
  value       = azurerm_key_vault.main.vault_uri
}
