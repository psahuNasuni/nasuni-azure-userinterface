
resource "random_id" "unique_SearchUI_id" {
  byte_length = 2
}

resource "null_resource" "install_searchui_web" {
  provisioner "local-exec" {
    command = "./Install_SearchUI_Web.sh"
  }
  depends_on = [null_resource.update_searchui_js]
}

data "azurerm_key_vault" "acs_key_vault" {
  name                = var.acs_key_vault
  resource_group_name = var.acs_resource_group
}

data "azurerm_key_vault_secret" "kvsecret" {
  name         = "search-endpoint-test"
  key_vault_id = data.azurerm_key_vault.acs_key_vault.id
}

resource "null_resource" "update_searchui_js" {
  provisioner "local-exec" {
    command = "sed -i 's#var volume_api.*$#var volume_api = \"${data.azurerm_key_vault_secret.kvsecret.value}\"; #g' SearchUI_Web/search.js"
  }
  provisioner "local-exec" {
    command = "sed -i 's#var search_api.*$#var search_api = \"${data.azurerm_key_vault_secret.kvsecret.value}\"; #g' SearchUI_Web/search.js"
  }
  provisioner "local-exec" {
    command = "sudo service apache2 restart"
  }
}
