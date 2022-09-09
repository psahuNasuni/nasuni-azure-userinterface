#!/bin/bash
CHECK=""
#NAC_SCHEDULER_NAME="$1"
### Create Apache server logs at defined path: /etc/apache2/logs . Log path can be changed as per need.
##sed -i 's#var schedulerName.*$#var schedulerName= "'"${NAC_SCHEDULER_NAME}"'"; #g' $HOME/nasuni-opensearch-userinterface/Tracker_UI/docs/fetch.js"
APACHE_LOG_DIR="/etc/apache2/logs"
APACHE_CONF="/etc/apache2/apache2.conf"
#APACHE_CONF="./apache2.conf"

#Creating Apache Server Log Directory
sudo mkdir $APACHE_LOG_DIR
sudo chmod -R 755 $APACHE_LOG_DIR
if [ -f $APACHE_CONF ];then
    CHECK=`cat $APACHE_CONF | grep "Alias /search /var/www/SearchUI_Web"`
else
    echo "ERROR ::: Could not find the server configuraton file $APACHE_CONF. Try after reinstalling Apache server !!!"
    exit 1
fi

sudo chmod 755 $APACHE_CONF
if [[ $CHECK == "" ]]; then
    echo "Alias /search /var/www/SearchUI_Web
    <Directory /var/www/SearchUI_Web>
        Order Allow,Deny
        Allow from all
    </Directory>
    Alias /tracker /var/www/Tracker_UI/docs
    <Directory /var/www/Tracker_UI/docs>
        Order Allow,Deny
        Allow from all
    </Directory>" >> $APACHE_CONF
    echo "INFO ::: Alias for Tracker_UI and SearchUI_Web created in $APACHE_CONF"
else
    echo "INFO ::: Alias for Tracker_UI and SearchUI_Web already exists in $APACHE_CONF"
fi
### Configuring Sites Availability for NAC SearchUI_Web. Here ServerAdmin refers to the Domain name(Optional)
SITES_AVAILABLE="/etc/apache2/sites-available"
sudo chmod -R 755 $SITES_AVAILABLE
#SITES_AVAILABLE_SearchUI_Web="./searchUI.conf"
cd $SITES_AVAILABLE
echo "------------------------------------------------------------------------------"
pwd
echo "------------------------------------------------------------------------------"
SITES_AVAILABLE_SearchUI_Web="search.conf"
echo "ServerAdmin admin@nasuni.com
ServerName nasuni.com
DocumentRoot /var/www/SearchUI_Web
ErrorLog $APACHE_LOG_DIR/error.log
CustomLog $APACHE_LOG_DIR/access.log combined" > $SITES_AVAILABLE_SearchUI_Web
sudo chmod 755 $SITES_AVAILABLE_SearchUI_Web
echo "INFO ::: Server availability configuration done for SearchUI_Web" 
### Configuring Sites Availability for NAC Tracker_UI. Here ServerAdmin refers to the Domain name(Optional)
#SITES_AVAILABLE_Tracker_UI="./trackerUI.conf"
SITES_AVAILABLE_Tracker_UI="tracker.conf"
echo "ServerAdmin admin@nasuni.com
ServerName nasuni.com
DocumentRoot /var/www/Tracker_UI/docs
ErrorLog $APACHE_LOG_DIR/error.log
CustomLog $APACHE_LOG_DIR/access.log combined" > $SITES_AVAILABLE_Tracker_UI
sudo chmod 755 $SITES_AVAILABLE_Tracker_UI
echo "INFO ::: Server availability configuration done for Tracker_UI" 

### To disable the Default site configuration in the NACSCheduler
sudo a2dissite 000-default.conf  
### To Enable the Tracker UI Web site configuration
sudo a2ensite $SITES_AVAILABLE_Tracker_UI
### To Enable the Search UI Web site configuration
sudo a2ensite $SITES_AVAILABLE_SearchUI_Web

sudo service apache2 restart
