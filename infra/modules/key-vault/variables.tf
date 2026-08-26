variable "name" {
  description = "Name of the Key Vault."
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Resource Group containing the Key Vault."
  type        = string
}

variable "location" {
  description = "Azure location of the Key Vault."
  type        = string
}

variable "tenant_id" {
  description = "Microsoft Entra tenant ID used by the Key Vault."
  type        = string
}

variable "environment" {
  description = "Deployment environment used for Key Vault tags."
  type        = string
}
