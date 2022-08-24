import os
import logging
import json
import requests
import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.appconfiguration import AzureAppConfigurationClient, ConfigurationSetting

def generateResponse(response, access_url, unifs_toc_handle, nmc_volume_name):
    """
    Update the File URL in Response
    """
    updated_values = []
    response = json.loads(response.text)
    extract = lambda x: access_url + x["File_Location"].split("\\")[-1]
    for recordes in response['value']:
        recordes["File_Location"] = extract(recordes)
        recordes["TOC_Handle"] = unifs_toc_handle
        recordes["Volume_Name"] = nmc_volume_name
        updated_values.append(recordes)
    updated_values = {"value": updated_values}
    response.update(updated_values)
    return response


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    ### Connect to an App Configuration store
    connection_string = os.getenv('ACS_ADMIN_APP_CONFIG_CONNECTION_STRING')
    # connection_string = "Endpoint=https://nasuni-labs-acs-admin.azconfig.io;Id=l3/w-l0-s0:CCUv6UV80DrW8pZ8A7zt;Secret=3kQ0GVNf7nJ2CUb4Id5FtBeFcWbrrJOCu/tuVdUlHqU="
    app_config_client = AzureAppConfigurationClient.from_connection_string(connection_string)

    # Set the Azure Cognitive Search Variables
    retrieved_config_acs_api_key = app_config_client.get_configuration_setting(key='acs-api-key', label='acs-api-key')
    retrieved_config_nmc_api_acs_url = app_config_client.get_configuration_setting(key='nmc-api-acs-url', label='nmc-api-acs-url')
    # retrieved_config_datasource_connection_string = app_config_client.get_configuration_setting(key='datasource-connection-string', label='datasource-connection-string')
    # retrieved_config_destination_container_name = app_config_client.get_configuration_setting(key='destination-container-name', label='destination-container-name')
    retrieved_config_nmc_volume_name = app_config_client.get_configuration_setting(key='nmc-volume-name', label='nmc-volume-name')
    retrieved_config_unifs_toc_handle = app_config_client.get_configuration_setting(key='unifs-toc-handle', label='unifs-toc-handle')
    retrieved_config_web_access_appliance_address = app_config_client.get_configuration_setting(key='web-access-appliance-address', label='web-access-appliance-address')
    
    name = req.params.get("name")
    if not name:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            name = req_body.get("name")

    if not name:
        return func.HttpResponse(f"Search Query is empty, {name}")
    else:
        logging.info('Fetching Values Azure App Configuration')
 
        logging.info('Fetching Secretes from Azure App Configuration')
        acs_api_key = retrieved_config_acs_api_key.value
        nmc_api_acs_url = retrieved_config_nmc_api_acs_url.value
        # datasource_connection_string = retrieved_config_datasource_connection_string.value
        # destination_container_name = retrieved_config_destination_container_name.value
        nmc_volume_name = retrieved_config_nmc_volume_name.value
        unifs_toc_handle = retrieved_config_unifs_toc_handle.value
        web_access_appliance_address = retrieved_config_web_access_appliance_address.value

        access_url = "https://" + web_access_appliance_address + "/fs/view/" + nmc_volume_name + "/" 

        # Define the names for the data source, skillset, index and indexer
        # datasource_name = "datasource"
        # skillset_name = "skillset"
        index_name = "index"
        # indexer_name = "indexer"

        logging.info('Setting the endpoint')
        # Setup the endpoint
        endpoint = nmc_api_acs_url
        headers = {'Content-Type': 'application/json',
                'api-key': acs_api_key}
        params = {
            'api-version': '2020-06-30'
        }
                
        logging.info("Searching URl")
        if name == '*':
            r = requests.get(endpoint + "/indexes/" + index_name +
                 "/docs?&search=*", headers=headers, params=params)
        else:
            # Query the index to return the contents
            r = requests.get(endpoint + "/indexes/" + index_name +
                            "/docs?&search="+ name + '"', headers=headers, params=params)

        r = generateResponse(r, access_url, unifs_toc_handle, nmc_volume_name)
        return func.HttpResponse(
             json.dumps(r, indent=1),
             status_code=200
        )