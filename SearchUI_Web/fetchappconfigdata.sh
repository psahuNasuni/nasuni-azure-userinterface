#!/bin/bash
app_config_name=$1
key=$2
result=$(az appconfig kv list --name $1 --key $2)

formatted_result=$(echo "$result" | jq -r 'map({(.value): .label}) | add')

echo "$formatted_result" > /var/www/SearchUI_Web/sso.json
