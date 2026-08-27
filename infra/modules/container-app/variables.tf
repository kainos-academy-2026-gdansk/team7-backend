variable "container_app_name" {
  description = "Name of the backend Container App."
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Resource Group in which to create the Container App."
  type        = string
}

variable "location" {
  description = "Azure location of the Container App."
  type        = string
}

variable "environment" {
  description = "Deployment environment used for resource tags."
  type        = string
}

variable "container_app_environment_id" {
  description = "Resource ID of the shared Container Apps Environment."
  type        = string
}

variable "container_registry_login_server" {
  description = "Login server hostname of the existing Azure Container Registry (e.g. myregistry.azurecr.io)."
  type        = string
}

variable "container_registry_id" {
  description = "Resource ID of the existing Azure Container Registry. Used to grant the Container App's identity AcrPull."
  type        = string
}

variable "container_image" {
  description = "Full image reference to deploy, e.g. <login-server>/team7-backend:sha-xxxx."
  type        = string
}

variable "key_vault_id" {
  description = "Resource ID of the Key Vault used to store application secrets."
  type        = string
}

variable "key_vault_uri" {
  description = "URI of the Key Vault used to build versionless secret references."
  type        = string
}

variable "target_port" {
  description = "Port the backend container listens on."
  type        = number
  default     = 3000
}

variable "ingress_external_enabled" {
  description = "Whether the Container App ingress is reachable from the public internet."
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
