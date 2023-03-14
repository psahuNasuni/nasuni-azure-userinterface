# -*- coding: utf-8 -*-
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
    extract = lambda x, y: access_url + y + "/" + x["file_location"].split("\\")[-1]
    for recordes in response['value']:
        recordes["file_location"] = extract(recordes, recordes["volume_name"])
        updated_values.append(recordes)
    updated_values = {"value": updated_values}
    response.update(updated_values)
    return response


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    # Connect to an App Configuration store
    connection_string = os.environ["AZURE_APP_CONFIG"]
    app_config_client = AzureAppConfigurationClient.from_connection_string(connection_string)

    # Set the Azure Cognitive Search Variables
    retrieved_config_acs_api_key = app_config_client.get_configuration_setting(key='acs-api-key', label='acs-api-key')
    retrieved_config_nmc_api_acs_url = app_config_client.get_configuration_setting(key='nmc-api-acs-url', label='nmc-api-acs-url')
    retrieved_config_web_access_appliance_address = app_config_client.get_configuration_setting(key='web-access-appliance-address', label='web-access-appliance-address')
    search_query=''
    volume_name=''
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
        char = '~'
        if char in name:
            l_search_term=name.split('~')
            search_query=l_search_term[0]
            volume_name=l_search_term[1]
        else:
            search_query=name
            volume_name=''

        logging.info('Fetching Secretes from Azure App Configuration')
        acs_api_key = retrieved_config_acs_api_key.value
        nmc_api_acs_url = retrieved_config_nmc_api_acs_url.value
        web_access_appliance_address = retrieved_config_web_access_appliance_address.value

        access_url = "https://" + web_access_appliance_address + "/fs/view/"

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

        # Check from specific volumes
        if volume_name != '':
            logging.info('INFO ::: Selected Volume {}'.format(volume_name))
            if search_query == '*':
                r = requests.get(endpoint + "/indexes/" + index_name + "/docs?&search=*&$filter=search.in(volume_name,'" + volume_name + "')", headers=headers, params=params)
            else:
                r = requests.get(endpoint + "/indexes/" + index_name + "/docs?&search=" + search_query + '"' + "&$filter=search.in(volume_name,'" + volume_name + "')", headers=headers, params=params)
        else: # Check from all volumes
            logging.info('INFO ::: Selected all Volume')
            if search_query == '*':
                r = requests.get(endpoint + "/indexes/" + index_name + "/docs?&search=*", headers=headers, params=params)
            else:
                r = requests.get(endpoint + "/indexes/" + index_name + "/docs?&search=" + search_query + '"', headers=headers, params=params)

        logging.info('INFO ::: Response URL:{}'.format(r))

        r = generateResponse(r, access_url)
        logging.info('INFO ::: Response URL After generating Response:{}'.format(r))
        return func.HttpResponse(
             json.dumps(r, indent=1),
             status_code=200
        )
