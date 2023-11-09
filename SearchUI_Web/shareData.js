
function readJsonFile(filename, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', filename);
  
    xhr.onload = function () {
      if (xhr.status === 200) {
        const jsonData = JSON.parse(xhr.responseText);
        callback(null, jsonData);
      } else {
        callback(new Error('Error loading JSON file: ' + xhr.status), null);
      }
    };
  
    xhr.onerror = function () {
      callback(new Error('Error loading JSON file'), null);
    };
  
    xhr.send();
  }
  
  function handleJsonFile() {
    const shareFilename = 'share_data.json'; // Replace with the desired JSON file name
    const nmcFilename = "nmc_details.json";
    const hostFilename="hostnames.json";

    readJsonFile(shareFilename, function (error, jsonData) {
      if (error) {
        console.error('Error reading JSON file:', error);
        return;
      }
  
      console.log('JSON data:', jsonData);
      
      shareGet(jsonData)
      });

    readJsonFile(nmcFilename, function (error, jsonDataNmc) {
        if (error) {
          console.error('Error reading JSON file:', error);
          return;
        }
    
        console.log('JSON data:', jsonDataNmc);
        console.log(Object.keys(jsonDataNmc).length)
        applianceData(jsonDataNmc.web_access_appliance_address)

      });
      readJsonFile(hostFilename, function (error, hostData) {
        if (error) {
          console.error('Error reading JSON file:', error);
          return;
        }
        
        getHostname(hostData)
        });
  }

  


  

  
  
  
  