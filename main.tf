data "azurerm_client_config" "current" {}

resource "random_id" "unique_SearchUI_id" {
  byte_length = 2
}

data "azurerm_resource_group" "acs_resource_group" {
  name = var.acs_resource_group
}

resource "null_resource" "install_searchui_web" {
  provisioner "local-exec" {
    command = "./Install_SearchUI_Web.sh"
  }
  depends_on = [null_resource.update_searchui_js]
}

data "azurerm_key_vault" "acs_key_vault" {
  name                = var.acs_key_vault
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
}

data "archive_file" "test" {
  type        = "zip"
  source_dir  = "./SearchFunction"
  output_path = var.output_path
}

resource "azurerm_storage_account" "storage_account" {
  name                     = "nasunist${random_id.unique_SearchUI_id.hex}"
  resource_group_name      = data.azurerm_resource_group.acs_resource_group.name
  location                 = data.azurerm_resource_group.acs_resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  # allow_blob_public_access = true
}

resource "azurerm_application_insights" "app_insights" {
  name                = "nasuni-app-insights-${random_id.unique_SearchUI_id.hex}"
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
  location            = data.azurerm_resource_group.acs_resource_group.location
  application_type    = "web"
}

resource "azurerm_app_service_plan" "app_service_plan" {
  name                = "nasuni-app-service-plan-${random_id.unique_SearchUI_id.hex}"
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
  location            = data.azurerm_resource_group.acs_resource_group.location
  kind                = "FunctionApp"
  reserved            = true # This has to be set to true for Linux. Not related to the Premium Plan
  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

resource "azurerm_function_app" "function_app" {
  name                = "nasuni-searchfunction-app-${random_id.unique_SearchUI_id.hex}"
  resource_group_name = data.azurerm_resource_group.acs_resource_group.name
  location            = data.azurerm_resource_group.acs_resource_group.location
  app_service_plan_id = azurerm_app_service_plan.app_service_plan.id
  app_settings = {
    "WEBSITE_RUN_FROM_PACKAGE"       = "1",
    "FUNCTIONS_WORKER_RUNTIME"       = "python",
    "AzureWebJobsDisableHomepage"    = "false",
    "https_only"                     = "true",
    "APPINSIGHTS_INSTRUMENTATIONKEY" = "${azurerm_application_insights.app_insights.instrumentation_key}"
  }
  identity {
    type = "SystemAssigned"
  }
  os_type = "linux"
  site_config {
    linux_fx_version          = "Python|3.9"
    use_32_bit_worker_process = false
    cors {
      allowed_origins = ["*"]
    }
  }
  storage_account_name       = azurerm_storage_account.storage_account.name
  storage_account_access_key = azurerm_storage_account.storage_account.primary_access_key
  version                    = "~3"
  depends_on = [
    azurerm_storage_account.storage_account,
    azurerm_app_service_plan.app_service_plan
  ]
}

locals {
  publish_code_command = "az functionapp deployment source config-zip -g ${data.azurerm_resource_group.acs_resource_group.name} -n ${azurerm_function_app.function_app.name} --src ${var.output_path}"
}

resource "null_resource" "function_app_publish" {
  provisioner "local-exec" {
    command = local.publish_code_command
  }
  depends_on = [azurerm_function_app.function_app, local.publish_code_command]
  triggers = {
    input_json           = filemd5(var.output_path)
    publish_code_command = local.publish_code_command
  }
}

resource "azurerm_key_vault_access_policy" "func_vault_id_mngmt" {
  key_vault_id = data.azurerm_key_vault.acs_key_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_function_app.function_app.identity.0.principal_id

  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
    "Recover",
    "Backup",
    "Restore"
  ]

  depends_on = [data.azurerm_key_vault.acs_key_vault]
}

resource "null_resource" "set_key_vault_env_var" {
  provisioner "local-exec" {
    command = "az functionapp config appsettings set --name ${azurerm_function_app.function_app.name} --resource-group ${data.azurerm_resource_group.acs_resource_group.name} --settings AZURE_KEY_VAULT=${data.azurerm_key_vault.acs_key_vault.name}"
  }
}

resource "null_resource" "update_searchui_js" {
  provisioner "local-exec" {
    command = "sed -i 's#var search_api.*$#var search_api = \"https://${azurerm_function_app.function_app.default_hostname}/api/search\"; #g' SearchUI_Web/search.js"
  }

  depends_on = [null_resource.function_app_publish]
}

output "FunctionAppSearchURL" {
  value = "https://${azurerm_function_app.function_app.default_hostname}/api/search"
}
