# -*- coding: utf-8 -*-
from asyncio.log import logger
import os
import logging
import json
import requests
import azure.functions as func
from azure.appconfiguration import AzureAppConfigurationClient

# def get_volumes(response):
#     """
#     Get volume list from Response
#     """
#     volume_list = []
#     response = json.loads(response.text)
#     logging.info('INFO ::: Insite get_volume Response: {}'.format(response))
#     for recordes in response['value']:
#         if recordes['volume_name'] != None and  recordes['volume_name'] not in volume_list:
#             volume_list.append(recordes['volume_name'])
#     return volume_list


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    # Connect to an App Configuration store
    connection_string = os.environ["AZURE_APP_CONFIG"]
    logger.info("INFO ::: Connection String: {}".format(connection_string))
    app_config_client = AzureAppConfigurationClient.from_connection_string(connection_string)

    logging.info('Fetching Secretes from Azure App Configuration')

    # Set the Azure Cognitive Search Variables
    acs_api_key = app_config_client.get_configuration_setting(key='acs-api-key', label='acs-api-key').value
    nmc_api_acs_url = app_config_client.get_configuration_setting(key='nmc-api-acs-url', label='nmc-api-acs-url').value
    volume_name_iterator=app_config_client.list_configuration_settings(key_filter="web-access-appliance-address")

    
    volume_name=[]
    try:
        for appsetting in volume_name_iterator:
            label=appsetting.label
            label=label.replace("-web-access-appliance-address","")
            volume_name.append(label)
    except Exception as e:
        print(e)

    response = {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": '*'
            },
            "isBase64Encoded": False
        } 
    response['body'] = volume_name

    return func.HttpResponse(
            json.dumps(response, indent=1),
            status_code=200
    )

    # logging.info('INFO ::: acs_api_key:{}'.format(acs_api_key))
    # logging.info('INFO ::: nmc_api_acs_url:{}'.format(nmc_api_acs_url))
    # # Define the names for the data source, skillset, index and indexer
    # index_name = "index"
    # logging.info('Setting the endpoint')
    # # Setup the endpoint
    # endpoint = nmc_api_acs_url
    # headers = {'Content-Type': 'application/json',
    #         'api-key': acs_api_key}
    # params = {
    #     'api-version': '2020-06-30'
    # }
            
    # logging.info("Searching URl")
    # r = requests.get(endpoint + "/indexes/" + index_name +
    #             "/docs?&search=*", headers=headers, params=params)

    # logging.info('INFO ::: Request Json:{}'.format(r))
    # r = get_volumes(r)
    # logging.info('INFO ::: Volume List:{}'.format(r))
    # response = {
    #         "statusCode": 200,
    #         "headers": {
    #             "Access-Control-Allow-Origin": '*'
    #         },
    #         "isBase64Encoded": False
    #     } 
    # response['body'] = json.dumps(r)
    # logging.info('INFO ::: Response Json:{}'.format(response))
    # return func.HttpResponse(
    #         json.dumps(response, indent=1),
    #         status_code=200
    # )
