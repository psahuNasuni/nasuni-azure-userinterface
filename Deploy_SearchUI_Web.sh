#!/bin/bash
echo '@@@@@@@@@@@@@@@@@@@@@ STARTED - Install WEB Server            @@@@@@@@@@@@@@@@@@@@@@@'
sudo apt update
sudo apt install apache2 -y
sudo ufw app list
sudo ufw allow 'Apache'
sudo service apache2 restart
echo '@@@@@@@@@@@@@@@@@@@@@ FINISHED - Install WEB Server             @@@@@@@@@@@@@@@@@@@@@@@'
echo '@@@@@@@@@@@@@@@@@@@@@ STARTED  - Deployment of SearchUI Web Site @@@@@@@@@@@@@@@@@@@@@@@'
sudo chmod -R 755 /var/www
sudo cp -r SearchUI_Web /var/www/.
sudo cp -r Tracker_UI /var/www/.
sudo rm -rf /var/www/html/index.html
sudo chmod 755 WebConfig.sh
sudo ./WebConfig.sh
sudo service apache2 restart
sudo service apache2 restart
echo Nasuni Cognitive Search Web portal: http://$(curl ifconfig.me)/search
echo Nasuni Cognitive TrackerUI Web portal: http://$(curl ifconfig.me)/tracker
echo '@@@@@@@@@@@@@@@@@@@@@ FINISHED - Deployment of SearchUI Web Site @@@@@@@@@@@@@@@@@@@@@@@'
