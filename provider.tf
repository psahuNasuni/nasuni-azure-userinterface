########################################################
##  Developed By  :   Pradeepta Kumar Sahu
##  Project       :   Nasuni - Azure CognitiveSearch Integration
##  Organization  :   Nasuni Labs   
#########################################################

# Configure the Microsoft Azure Provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.17.0"
    }
  }
}

provider "azurerm" {
  features {}
}
