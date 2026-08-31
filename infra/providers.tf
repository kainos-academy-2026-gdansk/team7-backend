terraform {
  required_version = ">= 1.11.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "team-7"
    storage_account_name = "team7fstate"
    container_name       = "tfstate"
    key                  = "team7-backend.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {}
}
