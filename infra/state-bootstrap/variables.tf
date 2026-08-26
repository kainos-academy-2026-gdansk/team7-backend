variable "resource_group_name" {
  description = "Name of the existing Resource Group used by the bootstrap resources."
  type        = string
  default     = "team-7"
}

variable "storage_account_name" {
  description = "Globally unique Storage Account name for Terraform remote state."
  type        = string
  default     = "team7fstatewiktor"

  validation {
    condition     = can(regex("^[a-z0-9]{3,24}$", var.storage_account_name))
    error_message = "Storage Account names must contain 3-24 lowercase letters or numbers."
  }
}

variable "container_name" {
  description = "Private Blob container name for Terraform remote state."
  type        = string
  default     = "tfstate"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", var.container_name))
    error_message = "Blob container names must contain 3-63 lowercase letters, numbers, or hyphens."
  }
}
