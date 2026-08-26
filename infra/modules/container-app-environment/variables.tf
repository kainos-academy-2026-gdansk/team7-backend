variable "container_app_environment_name" {
  description = "Name of the shared Container Apps Environment."
  type        = string
}

variable "log_analytics_workspace_name" {
  description = "Name of the Log Analytics Workspace used by the shared environment."
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Resource Group containing the shared environment."
  type        = string
}

variable "location" {
  description = "Azure location of the shared environment."
  type        = string
}

variable "environment" {
  description = "Deployment environment used for resource tags."
  type        = string
}
