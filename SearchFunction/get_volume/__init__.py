import os
import logging
import json
import requests
import azure.functions as func
from azure.appconfiguration import AzureAppConfigurationClient

def get_volumes(response):
    """
    Get volume list from Response
    """
    volume_list = []
    response = json.loads(response.text)
    for recordes in response['value']:
        if recordes['volume_name'] not in volume_list:
            volume_list.append(recordes['volume_name'])
    return volume_list


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    # Connect to an App Configuration store
    connection_string = os.environ["AZURE_APP_CONFIG"]
    app_config_client = AzureAppConfigurationClient.from_connection_string(connection_string)

    # Set the Azure Cognitive Search Variables
    retrieved_config_acs_api_key = app_config_client.get_configuration_setting(key='acs-api-key', label='acs-api-key')
    retrieved_config_nmc_api_acs_url = app_config_client.get_configuration_setting(key='nmc-api-acs-url', label='nmc-api-acs-url')

    logging.info('Fetching Values Azure App Configuration')

    logging.info('Fetching Secretes from Azure App Configuration')
    acs_api_key = retrieved_config_acs_api_key.value
    nmc_api_acs_url = retrieved_config_nmc_api_acs_url.value

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
    r = requests.get(endpoint + "/indexes/" + index_name +
                "/docs?&search=*", headers=headers, params=params)
    
    r = get_volumes(r)

    response = {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": '*'
            },
            "isBase64Encoded": False
        }
    response['volume'] = json.dumps(r)
    return func.HttpResponse(
            json.dumps(response, indent=1),
            status_code=200
    )