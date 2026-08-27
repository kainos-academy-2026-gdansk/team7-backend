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

variable "container_app_name" {
  description = "Name of the backend Container App."
  type        = string
  default     = "team7-backend"
}

variable "container_registry_name" {
  description = "Name of the existing Azure Container Registry that hosts the backend image."
  type        = string
  default     = "acraiacademy26"
}

variable "container_registry_resource_group_name" {
  description = "Resource group containing the existing Azure Container Registry."
  type        = string
  default     = "rg-ai-academy-26"
}

variable "container_image" {
  description = "Full image reference for the backend Container App, e.g. <login-server>/team7-backend:<tag>."
  type        = string
}

variable "target_port" {
  description = "Port the backend container listens on."
  type        = number
  default     = 3000
}

variable "ingress_external_enabled" {
  description = "Whether the backend Container App is reachable from the public internet."
  type        = bool
  default     = true
}

variable "container_cpu" {
  description = "vCPU allocated to the backend container."
  type        = number
  default     = 0.25
}

variable "container_memory" {
  description = "Memory allocated to the backend container."
  type        = string
  default     = "0.5Gi"
}

variable "min_replicas" {
  description = "Minimum number of backend Container App replicas."
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum number of backend Container App replicas."
  type        = number
  default     = 1
}
