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

  const ssoFilename = "sso.json";
  readJsonFile(ssoFilename, function (error, ssoData) {
    if (error) {
      console.error('Error reading JSON file:', error);
      return;
    }

    ssoGet(ssoData)
  });
}
