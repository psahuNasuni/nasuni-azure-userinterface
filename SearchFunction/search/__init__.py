import os
import logging
import json
import requests
import azure.functions as func
from azure.appconfiguration import AzureAppConfigurationClient

def generateResponse(response, access_url):
    """
    Update the File URL in Response
    """
    updated_values = []
    response = json.loads(response.text)
    extract = lambda x: access_url + x["file_location"].split("\\")[-1]
    for recordes in response['value']:
        recordes["file_location"] = extract(recordes)
        updated_values.append(recordes)
    updated_values = {"value": updated_values}
    response.update(updated_values)
    return response


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    ### Connect to an App Configuration store
    connection_string = os.environ["AZURE_APP_CONFIG"]
    # connection_string = "Endpoint=https://nasuni-labs-acs-admin.azconfig.io;Id=l3/w-l0-s0:CCUv6UV80DrW8pZ8A7zt;Secret=3kQ0GVNf7nJ2CUb4Id5FtBeFcWbrrJOCu/tuVdUlHqU="
    app_config_client = AzureAppConfigurationClient.from_connection_string(connection_string)

    # Set the Azure Cognitive Search Variables
    retrieved_config_acs_api_key = app_config_client.get_configuration_setting(key='acs-api-key', label='acs-api-key')
    retrieved_config_nmc_api_acs_url = app_config_client.get_configuration_setting(key='nmc-api-acs-url', label='nmc-api-acs-url')
    retrieved_config_nmc_volume_name = app_config_client.get_configuration_setting(key='nmc-volume-name', label='nmc-volume-name')
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
        nmc_volume_name = retrieved_config_nmc_volume_name.value
        web_access_appliance_address = retrieved_config_web_access_appliance_address.value

        access_url = "https://" + web_access_appliance_address + "/fs/view/" + nmc_volume_name + "/" 

        # Define the names for the data source, skillset, index and indexer
        index_name = "index"
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

        r = generateResponse(r, access_url)
        return func.HttpResponse(
             json.dumps(r, indent=1),
             status_code=200
        )