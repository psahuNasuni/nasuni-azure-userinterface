var search_api = "https://nasuni-searchfunction-app-ae20.azurewebsites.net/api/search" ; 
var volume_api = "https://nasuni-searchfunction-app-ae20.azurewebsites.net/api/get_volume" ; 
var prevSearch=""
var nextSearch=""
var currentSearch=""
var loadingdiv = $('#loading');
var noresults = $('#noresults');
var resultdiv = $('#results');
var searchbox = $('input#search');
var rangeDiv = $('#dataRangeDiv');
var timer = 0;
var arr = [];
var responseArr = [];
var prevResponse =[]
var volume='all';
var volSelect;
let pagiResults = 1;
var dataLen = 5;
var index = 0;
var numArr = []
var shareData={}
var rightPart=""
var edgeAppliance ="";
var file_Share_url=""
var shareName=""
var file_url
var file_loc
var lastRange=0
var firstRange=0
var rng=1
var skipVal
var totalData=0
var ifSkip=1
// Executes the search function 250 milliseconds after user stops typing
searchbox.keyup(function() {
    clearTimeout(timer);
    timer = setTimeout(search, 500);
    paginationData(1)
});

function dropDownData(period) {
    volSelect = ""
    volume = period;
    console.log(period ,"and its subsequent sso-url is:",ssoData[volume]);
    if (searchbox.val() != "") {
        search();
    }
    if (ssoData[volume]!="undefined"){
        ssoTrigger(ssoData[volume])
    }
    
}

function paginationData(period) {
    pagiResults = period;
    console.log(pagiResults + "   pagination page number");
    indexChange();
}


function ssoTrigger(url) {
    let newWindow = window.open(url, "_blank", "width=0,height=0,top=0,left=0");

  // Set a timeout to close the window after 30 seconds
  setTimeout(() => {
    newWindow.close();
  }, 30000);

  // Check the URL status and log it to the console after the window is closed
  newWindow.addEventListener("beforeunload", () => {
    fetch(url)
      .then((response) => response.status)
      .then((status) => console.log(`URL status: ${status}`));
  });
}

async function search() {
    // totalRes
    // Clear results before searching
    noresults.hide();
    resultdiv.empty();
    loadingdiv.show();
    // Get the query from the user
    if (volume == undefined || volume == " ") {
        console.log("no volume selected");
        // throw new Error("Something went badly wrong!");
        loadingdiv.hide();
        noresults.hide();
        var content = document.createElement("div");
        content.innerHTML += "<p class='result-status'><b>No volume was selected</p>";
        resultdiv.append(content);
        return;
    } else if (volume == "all") {
        volume = "";
    }

    var query = searchbox.val() + "~" + volume;

    console.log(query);
    // Only run a query if the string contains at least three characters
    if (query.length > 0) {
        // Make the HTTP request with the query as a parameter and wait for the JSON results
        if(responseArr==""){
            currentSearch=search_api
            skipVal = 0
        }else{
            skipVal = nextPara.skip
        }
        prevSearch=currentSearch
        
        prevSkip=skipVal
        console.log(skipVal)

        var response_data = await $.get(currentSearch, { name: query, size: 25,count:'true',skip:skipVal}, 'json');
        
        console.log(typeof(response_data));
        // Get the part of the JSON response that we care about
        if (response_data.length > 0) {
            loadingdiv.hide();
            noresults.hide();
            // Iterate through the results and write them to HTML
            responseArr = JSON.parse(response_data);
            nextPara=responseArr["@search.nextPageParameters"]
            if(skipVal==undefined){
                
                skip=nextPara.skip
            }

            totalData=responseArr["@odata.count"]
            
            resultdiv.append('<p class="result-status">Found ' + totalData + ' results.</p>');
            
            // nextSearch=responseArr["@odata.nextLink"]
            console.log(responseArr)
            console.log(responseArr["@odata.nextLink"])
                    
            appendData(resultdiv, responseArr);
        } else {
            noresults.show();
        }
    }
    loadingdiv.hide();
}

async function searchNext(nextLink){

    var response_data = await $.get(currentSearch, {  next_url_endpoint:nextLink,count:'true',skip:skipVal}, 'json');

    latestResponse = JSON.parse(response_data);
    responseArr.value=responseArr.value.concat(latestResponse.value);
    responseArr.nextParamerters=latestResponse.nextParamerters;
        
    appendData(resultdiv, responseArr);
}

//Iterate volume names from API to drop down menu
async function start() {
    currentSearch=search_api
    handleJsonFile()
    const urlParams = new URLSearchParams(location.search);
    volSelect = urlParams.get('q');
    if (volSelect != null) {
        volume = volSelect
        document.getElementById("defVal").value = volSelect
        document.getElementById("defVal").innerText = volSelect
    } else {
        document.getElementById("defVal").value = "none"
        document.getElementById("defVal").innerText = "Select Volume"
    }
    console.log(volSelect)
    response = await $.get(volume_api, 'json');
    response = JSON.parse(response);
    // arr = response.body.split(","); 
    arr=response.body;  
    var chars = ['[', ']', '\\', '"'];
    replaceAll(chars);
}

//Filtering and removing extra characters
function replaceAll(chars) {
    for (var i = 0; i < chars.length; i++) {
        for (var j = 0; j < arr.length; j++) {
            var x = String(arr[j])

            x = x.replaceAll(chars[i], '');
            x = x.replaceAll(/\s/g, '')
            arr[j] = x;
        }

    }
    appendDropDown(arr);
}

//Appending from volume name array to drop down
function appendDropDown(arr) {
    var selectOpt = document.getElementById("selectVolume");
    console.log(volSelect)

    for (var i = 0; i < arr.length; i++) {
        var opt = arr[i];
        var el = document.createElement("option");


        el.textContent = opt;
        el.value = opt;
        selectOpt.appendChild(el);
    }
}

function pos_to_neg(num){
    return -Math.abs(num);
}


function dataRange(){
    rangeDiv.empty()
    var leftButtonLi = document.createElement("li");
    var dataRangeText = document.createElement("p");
    dataRangeText.classList.add("data-range-text");
    var rightButtonLi = document.createElement("li");
    nextParamerters=responseArr["@search.nextPageParameters"]
 
    var count=parseInt(responseArr["@odata.count"])
    var total=parseInt(count/skip)
    if(skipVal==undefined ||skipVal==0){
        leftButtonLi.classList.add("disabled")
    }
    if(!nextParamerters){
        lastRange=count
        rightButtonLi.classList.add("disabled")
    }else{
        lastRange=nextParamerters.skip
    console.log(nextParamerters)
    }
    leftButtonLi.innerHTML='<span class="range-bt-span"><<</span>'

    leftButtonLi.onclick =function() {
        firstRange-=skip
        if(skipVal==skip){
            firstRange=0
        }
        
        skipVal=prevSkip-skip
        console.log(skipVal)
        if(skipVal==50){
            currentSearch=search_api
            lastRange=skipVal-lastRange-1
            
        }else{
            currentSearch=responseArr["@odata.nextLink"]
        }
        
        console.log(currentSearch)
        search()
    }

    rightButtonLi.onclick = function() {
        currentSearch=responseArr["@odata.nextLink"]
        console.log(currentSearch)
        firstRange=lastRange+1
        if(nextParamerters){
            skipVal=parseInt(nextParamerters.skip)
        }
        
        if(lastRange<=count){
            rng=rng+1
        }
        ifSkip=ifSkip*2
        search()
    }
    rightButtonLi.innerHTML='<span class="range-bt-span">>></span>'
    dataRangeText.innerHTML="  "+firstRange+" - "+lastRange+""
    rangeDiv.append(leftButtonLi)
    rangeDiv.append(dataRangeText)
    rangeDiv.append(rightButtonLi)
}

function indexChange() {
    for (var x = 0; x < pagiResults; x++) {
        var y = x * dataLen;
        numArr.push(y);
    }
    numArr = [...new Set(numArr)]
    index = numArr[pagiResults - 1]

    resultdiv.empty();
    resultdiv.append('<p class="result-status">Found ' + totalData + ' results.</p>');
    noresults.hide();
    loadingdiv.hide();
    appendData(resultdiv, responseArr);
}

function shareGet(res){
    shareData=res
}

function applianceData(res){
    edgeAppliance=res
}

function getHostname(res){
    hostNames=res
}

function ssoGet(res){
    ssoData=res
}

//Appending all the results to the main resultdiv 
function appendData(resultdiv, data) 
{
    for (var i = index; i < dataLen+index; i++) 
    {
        var link = document.createElement("h5");
        var content = document.createElement("span");
        var resultBox = document.createElement("div");
        var spanDiv = document.createElement('div');
        resultBox.classList.add("result-box");
        spanDiv.classList.add("result-content");
    
        if (Object.keys(data.value[0]).length >= 0) 
        {
            file_Share_url=""
            let sharePathExist = false
            volume=data.value[i].volume_name

            for(var j=0;j<shareData[volume].shares.length;j++)
            {
                var locationStr=data.value[i].file_path
                var fileLocation=data.value[i].file_location
                var sharePath=Object.values(shareData[volume].shares[j])[0]

                shareName=Object.keys(shareData[volume].shares[j])[0]
                erpFuncResponse=extractRightPath(locationStr,sharePath,fileLocation)  

                if(erpFuncResponse!=null)
                {
                    file_url=file_Share_url
                    file_loc=fileShareRedirectionUrl.trim().replace(/ /g,'%20');
                    sharePathExist=true
                    break
                }
            }

            if(!sharePathExist)
                {   
                    let volume = data.value[i].volume_name
                    let filePathList = data.value[i].file_path.split('blob.core.windows.net')[1]
                    filePath=filePathList.split('/').slice(2).join('/')
                    ipAddress=data.value[i].file_location.split('/')[2]
                    
                    let hostName=hostNames[ipAddress] || ipAddress
                    file_loc = "https://" + ipAddress + "/fs/view/" + volume + "/" + filePath
                    file_redirection_link="https://" + hostName + "/fs/view/" + volume + "/" + filePath
                    file_url=file_redirection_link.trim().replace(/%20/g,' ');
                }
            
            link.innerHTML = "<a class='elasti_link result-title' href=" + file_loc + ">" + file_url + "</a><br>";
            resultBox.append(link);

            if (data.value[i].content.length > 0) 
            {
                content.innerHTML += data.value[i].content;
                spanDiv.append(content);
                resultBox.append(spanDiv);
                resultdiv.append(resultBox);
            }

            stop();
        } 
    } 
    paginationTrigger(data)
}


function paginationTrigger(data) {
    if (pagiResults > 0) {
        var totalPages = data.value.length/dataLen;
        if (totalPages % 1 != 0) {
            totalPages = Math.trunc(totalPages + 1)
        }
        page = Number(pagiResults);
        var paginationDiv = document.getElementById('pagination');
        var ul = document.createElement('ul')
        paginationDiv.append(ul);

        if (page==totalPages)
        {   
            resultdiv.hide()
            loadingdiv.show()
            searchUrl=responseArr["@odata.nextLink"]
            searchNext(searchUrl)
            totalPages+=10
        }
        createPagination(totalPages, page);
        loadingdiv.hide()
        resultdiv.show()
    }
}

// Matching share path with file path
function extractRightPath(mainString, sharePath, fileLocation) {
    const regex = new RegExp(`(${sharePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(.*)`);
    let matchString=mainString.replace(/%20/g,' ');
    const match = regex.exec(matchString);
    let filerIp=fileLocation.split('/')[2]
    let hostName=hostNames[filerIp] || filerIp
    
    if (match) {
        rightPart = match[2].trim();
        console.log(rightPart)
        fileShareRedirectionUrl="https://"+filerIp+"/fs/view/"+shareName+rightPart
        file_Share_url="https://"+hostName+"/fs/view/"+shareName+rightPart
        return true
    }
  
    return null;
  }
