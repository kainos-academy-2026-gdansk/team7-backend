variable "server_name" {
  description = "Globally unique name of the PostgreSQL Flexible Server."
  type        = string
}

variable "database_name" {
  description = "Name of the application database."
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Resource Group containing the PostgreSQL server."
  type        = string
}

variable "location" {
  description = "Azure location of the PostgreSQL server."
  type        = string
}

variable "environment" {
  description = "Deployment environment used for resource tags."
  type        = string
}

variable "key_vault_id" {
  description = "Resource ID of the Key Vault containing the administrator password."
  type        = string
}

variable "administrator_login" {
  description = "Administrator login for the PostgreSQL server."
  type        = string
}

variable "administrator_password_secret_name" {
  description = "Name of the manually managed Key Vault secret containing the administrator password."
  type        = string
}

variable "administrator_password_version" {
  description = "Version counter used to trigger administrator password rotation."
  type        = number
}

variable "postgresql_version" {
  description = "Major PostgreSQL version."
  type        = string
}

variable "zone" {
  description = "Availability zone assigned to the PostgreSQL Flexible Server."
  type        = string
}

variable "sku_name" {
  description = "Compute SKU of the PostgreSQL Flexible Server."
  type        = string
}

variable "storage_mb" {
  description = "Provisioned PostgreSQL storage in MiB."
  type        = number
}

variable "storage_tier" {
  description = "Storage performance tier of the PostgreSQL Flexible Server."
  type        = string
}
