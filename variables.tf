
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

variable "nac_scheduler_name" {
  description = "Azure nac scheduler VM name "
  type        = string
  default     = ""
}

variable "output_path" {
  type        = string
  description = "function_path of file where zip file is stored"
  default     = "./SearchFunction.zip"
}

variable "user_resource_group_name" {
  description = "Virtual Network Resouce group name for Azure Function"
  type        = string
  default     = ""
}

variable "user_vnet_name" {
  description = "Virtual Network Name for Azure Function"
  type        = string
  default     = ""
}

variable "user_subnet_name" {
  description = "Available subnet name in Virtual Network"
  type        = string
  default     = ""
}

variable "use_private_ip" {
  description = "Use Private IP"
  type        = string
  default     = "N"
}

variable "search_outbound_subnet" {
  description = "Available subnet name in Virtual Network for outbound traffic integration"
  type        = list(string)
}
##################################################################
