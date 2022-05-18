#!/bin/bash
echo '@@@@@@@@@@@@@@@@@@@@@ STARTED - Inastall WEB Server            @@@@@@@@@@@@@@@@@@@@@@@'
sudo apt update
sudo apt install apache2 -y
sudo ufw app list
sudo ufw allow 'Apache'
sudo service apache2 restart
echo '@@@@@@@@@@@@@@@@@@@@@ FINISHED - Inastall WEB Server             @@@@@@@@@@@@@@@@@@@@@@@'
echo '@@@@@@@@@@@@@@@@@@@@@ STARTED  - Deployment of SearchUI Web Site @@@@@@@@@@@@@@@@@@@@@@@'
sudo chmod 755 SearchUI_Web/*
cd SearchUI_Web
sudo chmod 755 /var/www/html/*
sudo cp -a * /var/www/html/
sudo service apache2 restart
echo Nasuni ElasticSearch Web portal: http://$(curl checkip.amazonaws.com)/index.html
echo '@@@@@@@@@@@@@@@@@@@@@ FINISHED - Deployment of SearchUI Web Site @@@@@@@@@@@@@@@@@@@@@@@'"