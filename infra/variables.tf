variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "team-7"
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
  default     = "uksouth"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be dev, test, or prod."
  }
}

variable "key_vault_name" {
  description = "Globally unique name of the Key Vault."
  type        = string
  default     = "team7-KV"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]{1,22}[a-zA-Z0-9]$", var.key_vault_name))
    error_message = "Key Vault names must contain 3-24 letters, numbers, or hyphens, start with a letter, and end with a letter or number."
  }
}

variable "container_app_environment_name" {
  description = "Name of the shared Container Apps Environment."
  type        = string
  default     = "team7-cae-dev"
}

variable "log_analytics_workspace_name" {
  description = "Name of the shared Log Analytics Workspace."
  type        = string
  default     = "team7-law-dev"
}
