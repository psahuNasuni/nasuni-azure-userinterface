
################### SearchUI Specific Variables ###################
variable "acs_resource_group" {
  description = "Resouce group name for Azure Cognitive Search"
  type        = string
  default     = ""
}

variable "acs_admin_app_config_name" {
  description = "Azure acs_admin_app_config_name "
  type        = string
  default     = ""
}

variable "output_path" {
  type        = string
  description = "function_path of file where zip file is stored"
  default     = "./SearchFunction.zip"
}
  
variable "subscription_id" {
  description = "Subscription id of azure account"
  default     = ""
}

variable "tenant_id" {
  description = "Tenant id of azure account"
  default     = ""
}
##################################################################
