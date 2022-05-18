
################### SearchUI Specific Variables ###################
variable "git_repo_ui" {
  description = "git_repo_ui specific to certain repos"
  default = "nasuni-azure-userinterface"
}
variable "search_acs_function_url" {
  description = "URL of Azure search function that is capable of performing search operation in Azure CognitiveSearch"
  default = ""
}

variable "acs_volume_function_url" {
  description = "Azure function url for getting all the Volumes available in Azure CognitiveSearch"
  default = ""
}
#########################################