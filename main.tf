
resource "random_id" "unique_SearchUI_id" {
  byte_length = 2
}

resource "null_resource" "inatall_searchui_web" {
  provisioner "local-exec" {
          command = "./Inatall_SearchUI_Web.sh"
    }
# depends_on = []
}

resource "null_resource" "update_searchui_js" {
  provisioner "local-exec" {
          command = "sed -i 's#var volume_api.*$#var volume_api = \"${var.acs_volume_function_url}\"; #g' SearchUI_Web/search.js"
    }
  provisioner "local-exec" {
          command = "sed -i 's#var search_api.*$#var search_api = \"${var.search_acs_function_url}\"; #g' SearchUI_Web/search.js"
    }
  provisioner "local-exec" {
      command = "sudo service apache2 restart"
    }
  depends_on = [null_resource.inatall_searchui_web]
}

