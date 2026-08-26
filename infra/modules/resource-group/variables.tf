variable "name" {
  description = "Name of the Resource Group."
  type        = string
}

variable "location" {
  description = "Azure location of the Resource Group."
  type        = string
}

variable "environment" {
  description = "Deployment environment used for Resource Group tags."
  type        = string
}