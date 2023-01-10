data "azurerm_client_config" "current" {}

resource "random_id" "unique_SearchUI_id" {
  byte_length = 2
}

data "azurerm_resource_group" "acs_resource_group" {
  name = var.acs_resource_group
}

data "azurerm_app_configuration" "appconf" {
  name                = var.acs_admin_app_config_name
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
}

########### Create SEARCH Function ###########
data "archive_file" "test" {
  type        = "zip"
  source_dir  = "./SearchFunction"
  output_path = var.output_path
}

data "azurerm_virtual_network" "VnetToBeUsed" {
  count               = var.use_private_ip == "Y" ? 1 : 0
  name                = var.user_vnet_name
  resource_group_name = var.user_resource_group_name
}

data "azurerm_subnet" "azure_subnet_name" {
  count                = var.use_private_ip == "Y" ? 1 : 0
  name                 = var.user_subnet_name
  virtual_network_name = data.azurerm_virtual_network.VnetToBeUsed[0].name
  resource_group_name  = data.azurerm_virtual_network.VnetToBeUsed[0].resource_group_name
}

data "azurerm_private_dns_zone" "storage_account_dns_zone" {
  count               = var.use_private_ip == "Y" ? 1 : 0
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = data.azurerm_virtual_network.VnetToBeUsed[0].resource_group_name
}

resource "azurerm_subnet" "search_outbound_subnet_name" {
  count                = var.use_private_ip == "Y" ? 1 : 0
  name                 = "outbound-vnetSubnet-${random_id.unique_SearchUI_id.hex}"
  virtual_network_name = data.azurerm_virtual_network.VnetToBeUsed[0].name
  resource_group_name  = data.azurerm_virtual_network.VnetToBeUsed[0].resource_group_name
  address_prefixes     = [var.search_outbound_subnet[0]]
  delegation {
    name = "serverFarms_delegation"

    service_delegation {
      name = "Microsoft.Web/serverFarms"
    }
  }
}

resource "azurerm_storage_account" "storage_account" {
  name                     = "nasunist${random_id.unique_SearchUI_id.hex}"
  resource_group_name      = data.azurerm_resource_group.acs_resource_group.name
  location                 = data.azurerm_resource_group.acs_resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  depends_on = [
    data.azurerm_private_dns_zone.storage_account_dns_zone
  ]
}

resource "null_resource" "disable_storage_public_access" {
  provisioner "local-exec" {
    command = var.use_private_ip == "Y" ? "az storage account update --allow-blob-public-access false --name ${azurerm_storage_account.storage_account.name} --resource-group ${azurerm_storage_account.storage_account.resource_group_name}" : ""
  }
  depends_on = [azurerm_storage_account.storage_account]
}

resource "azurerm_private_endpoint" "storage_account_private_endpoint" {
  count               = var.use_private_ip == "Y" ? 1 : 0
  name                = "nasunist${random_id.unique_SearchUI_id.hex}_private_endpoint"
  location            = data.azurerm_virtual_network.VnetToBeUsed[0].location
  resource_group_name = data.azurerm_virtual_network.VnetToBeUsed[0].resource_group_name
  subnet_id           = data.azurerm_subnet.azure_subnet_name[0].id

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.storage_account_dns_zone[0].id]
  }

  private_service_connection {
    name                           = "nasunist${random_id.unique_SearchUI_id.hex}_connection"
    is_manual_connection           = false
    private_connection_resource_id = azurerm_storage_account.storage_account.id
    subresource_names              = ["blob"]
  }

  depends_on = [
    data.azurerm_private_dns_zone.storage_account_dns_zone,
    azurerm_storage_account.storage_account,
    null_resource.disable_storage_public_access
  ]
}

resource "azurerm_application_insights" "app_insights" {
  name                = "nasuni-app-insights-${random_id.unique_SearchUI_id.hex}"
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
  location            = data.azurerm_resource_group.acs_resource_group.location
  application_type    = "web"
}

resource "azurerm_service_plan" "app_service_plan" {
  name                = "nasuni-app-service-plan-${random_id.unique_SearchUI_id.hex}"
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
  location            = data.azurerm_resource_group.acs_resource_group.location
  os_type             = "Linux"
  sku_name            = "EP1"
}

data "azurerm_private_dns_zone" "search_function_app_dns_zone" {
  count               = var.use_private_ip == "Y" ? 1 : 0
  name                = "privatelink.azurewebsites.net"
  resource_group_name = data.azurerm_virtual_network.VnetToBeUsed[0].resource_group_name
}

resource "azurerm_linux_function_app" "search_function_app" {
  name                = "nasuni-searchfunction-app-${random_id.unique_SearchUI_id.hex}"
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
  location            = data.azurerm_resource_group.acs_resource_group.location
  service_plan_id     = azurerm_service_plan.app_service_plan.id
  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true",
    "FUNCTIONS_WORKER_RUNTIME"       = "python",
    "AzureWebJobsDisableHomepage"    = "false",
  }
  identity {
    type = "SystemAssigned"
  }
  site_config {
    use_32_bit_worker        = false
    application_insights_key = azurerm_application_insights.app_insights.instrumentation_key
    cors {
      allowed_origins = ["*"]
    }
    application_stack {
      python_version = "3.9"
    }
    ip_restriction {
      action                    = "Allow"
      name                      = "https"
      priority                  = "310"
      virtual_network_subnet_id = data.azurerm_subnet.azure_subnet_name[0].id
    }
    scm_ip_restriction {
      action                    = "Allow"
      name                      = "https"
      priority                  = "310"
      virtual_network_subnet_id = data.azurerm_subnet.azure_subnet_name[0].id
    }
  }
  https_only                  = "true"
  storage_account_name        = azurerm_storage_account.storage_account.name
  storage_account_access_key  = azurerm_storage_account.storage_account.primary_access_key
  functions_extension_version = "~4"

  depends_on = [
    azurerm_storage_account.storage_account,
    azurerm_private_endpoint.storage_account_private_endpoint,
    azurerm_service_plan.app_service_plan,
    data.azurerm_private_dns_zone.search_function_app_dns_zone
  ]
}


resource "azurerm_private_endpoint" "search_function_app_private_endpoint" {
  count               = var.use_private_ip == "Y" ? 1 : 0
  name                = "nasuni-searchfunction-app-${random_id.unique_SearchUI_id.hex}_private_endpoint"
  location            = data.azurerm_virtual_network.VnetToBeUsed[0].location
  resource_group_name = data.azurerm_virtual_network.VnetToBeUsed[0].resource_group_name
  subnet_id           = data.azurerm_subnet.azure_subnet_name[0].id

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.search_function_app_dns_zone[0].id]
  }

  private_service_connection {
    name                           = "nasuni-searchfunction-app-${random_id.unique_SearchUI_id.hex}_connection"
    is_manual_connection           = false
    private_connection_resource_id = azurerm_linux_function_app.search_function_app.id
    subresource_names              = ["sites"]
  }

  depends_on = [
    data.azurerm_private_dns_zone.search_function_app_dns_zone,
    azurerm_linux_function_app.search_function_app
  ]
}

resource "azurerm_app_service_virtual_network_swift_connection" "outbound_vnet_integration" {
  count          = var.use_private_ip == "Y" ? 1 : 0
  app_service_id = azurerm_linux_function_app.search_function_app.id
  subnet_id      = azurerm_subnet.search_outbound_subnet_name[0].id

  depends_on = [
    azurerm_linux_function_app.search_function_app
  ]
}

locals {
  publish_code_command = "az functionapp deployment source config-zip -g ${data.azurerm_resource_group.acs_resource_group.name} -n ${azurerm_linux_function_app.search_function_app.name} --build-remote true --src ${var.output_path}"
}

resource "null_resource" "function_app_publish" {
  provisioner "local-exec" {
    command = local.publish_code_command
  }
  depends_on = [
    azurerm_linux_function_app.search_function_app,
    azurerm_private_endpoint.search_function_app_private_endpoint,
    azurerm_app_service_virtual_network_swift_connection.outbound_vnet_integration,
    local.publish_code_command
  ]
  triggers = {
    input_json           = filemd5(var.output_path)
    publish_code_command = local.publish_code_command
  }
}

resource "null_resource" "set_app_config_env_var" {
  provisioner "local-exec" {
    command = "az functionapp config appsettings set --name ${azurerm_linux_function_app.search_function_app.name} --resource-group ${data.azurerm_resource_group.acs_resource_group.name} --settings AZURE_APP_CONFIG='${data.azurerm_app_configuration.appconf.primary_write_key[0].connection_string}'"
  }
}

########### Deploy SEARCH UI Web Site ###########
resource "null_resource" "install_searchui_web" {
  provisioner "local-exec" {
    command = "./Deploy_SearchUI_Web.sh"
  }
  depends_on = [null_resource.update_searchui_js]
}

resource "null_resource" "update_searchui_js" {
  provisioner "local-exec" {
    command = "sed -i 's#var search_api.*$#var search_api = \"https://${azurerm_linux_function_app.search_function_app.default_hostname}/api/search\"; #g' SearchUI_Web/search.js"
  }
  provisioner "local-exec" {
    command = "sed -i 's#var volume_api.*$#var volume_api = \"https://${azurerm_linux_function_app.search_function_app.default_hostname}/api/get_volume\"; #g' SearchUI_Web/search.js"
  }
  provisioner "local-exec" {
    command = "sed -i 's#var schedulerName.*$#var schedulerName = \"${var.nac_scheduler_name}\"; #g' Tracker_UI/docs/fetch.js"
  }

  depends_on = [null_resource.function_app_publish]
}
#############################################################

output "FunctionAppSearchURL" {
  value = "https://${azurerm_linux_function_app.search_function_app.default_hostname}/api/search"
}

output "FunctionAppVolumeURL" {
  value = "https://${azurerm_linux_function_app.search_function_app.default_hostname}/api/get_volume"
}
