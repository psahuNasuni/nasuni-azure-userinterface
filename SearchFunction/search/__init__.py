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
        recordes["object_key"] = recordes["file_location"]
        recordes["file_location"] = recordes["file_location"].replace(" ","%20")
        updated_values.append(recordes)
    updated_values = {"value": updated_values}
    response.update(updated_values)
    return response


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    # Connect to an App Configuration store
    connection_string = os.environ["AZURE_APP_CONFIG"]
    app_config_client = AzureAppConfigurationClient.from_connection_string(connection_string)

    logging.info('Fetching Secrets from Azure App Configuration')
    # Set the Azure Cognitive Search Variables
    acs_api_key = app_config_client.get_configuration_setting(key='acs-api-key', label='acs-api-key').value
    nmc_api_acs_url = app_config_client.get_configuration_setting(key='nmc-api-acs-url', label='nmc-api-acs-url').value
    web_access_appliance_address = app_config_client.get_configuration_setting(key='web-access-appliance-address', label='web-access-appliance-address').value

    access_url = "https://" + web_access_appliance_address + "/fs/view/"
    search_query = ''
    volume_name = ''

    top = req.params.get("top")
    skip = req.params.get("skip")
    search = req.params.get("search")
    filter = req.params.get("filter")
    next_url_endpoint = req.params.get("next_url_endpoint")
    
    try:
        req_body = req.get_json()
    except ValueError:
        pass
    else:
        top = req_body.get("top")
        skip = req_body.get("skip")
        search = req_body.get("search")
        filter = req_body.get("filter")
        next_url_endpoint = req_body.get("next_url_endpoint")

    headers = {
        'Content-Type': 'application/json',
        'api-key': acs_api_key
            }

    if next_url_endpoint:
        data = {
            "count": True,
        }
        
        if top:
            data["top"] = top
        if skip:
            data["skip"] = skip
        if search:
            data["search"] = search
        if filter:
            data["filter"] = filter

        try:
            r = requests.post(next_url_endpoint, json=data, headers=headers)
            r = generateResponse(r, access_url)

            logging.info(
                'INFO ::: Response URL After generating Response:{}'.format(r))
            return func.HttpResponse(
                json.dumps(r, indent=1),
                status_code=200
            )
        except requests.exceptions.RequestException as e:
            return func.HttpResponse(
                f"Error sending request: {str(e)}",
                status_code=500
            )
    else:
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
                l_search_term = name.split('~')
                search_query = l_search_term[0]
                volume_name = l_search_term[1]
            else:
                search_query = name
                volume_name = ''

            index_name = "index"
            logging.info('Setting the endpoint')
            # Setup the endpoint
            api_endpoint = nmc_api_acs_url
            params = {
                'api-version': '2020-06-30'
            }

            data = {
                "count": True,
                "search": search_query
            }

            if top:
                data["top"] = top
            if skip:
                data["skip"] = skip

            logging.info("Searching URl")

            # Check from specific volumes
            if volume_name != '':
                logging.info('INFO ::: Selected Volume {}'.format(volume_name))

                data["filter"] = "volume_name eq '{}'".format(volume_name)
                r = requests.post(api_endpoint + "/indexes/" + index_name +
                                  "/docs/search", params=params, headers=headers, json=data)

            else:  # Check from all volumes
                logging.info('INFO ::: Selected all Volume')

                r = requests.post(api_endpoint + "/indexes/" + index_name +
                                  "/docs/search", params=params, headers=headers, json=data)

            logging.info('INFO ::: Response URL:{}'.format(r))

            r = generateResponse(r, access_url)

            logging.info(
                'INFO ::: Response URL After generating Response:{}'.format(r))
            return func.HttpResponse(
                json.dumps(r, indent=1),
                status_code=200
            )
