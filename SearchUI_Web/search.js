var search_api = "";
var volume_api = "";
var loadingdiv = $('#loading');
var noresults = $('#noresults');
var resultdiv = $('#results');
var searchbox = $('input#search');
var timer = 0;
var arr = [];
var responseArr = [];
var volume = 'all';
var volSelect;
let pagiResults = 1;
var dataLen = 6;
var index = 0;
var numArr = []
var shareData = {}
var rightPart = ""
var edgeAppliance = "";
var file_Share_url = ""
var shareName = ""
var file_url
var file_loc

// Executes the search function 250 milliseconds after user stops typing
searchbox.keyup(function() {
    clearTimeout(timer);
    timer = setTimeout(search, 500);
    paginationData(1)
});

function dropDownData(period) {
    volSelect = ""
    volume = period;
    console.log(period);
    if (searchbox.val() != "") {
        search();
    }
}

function paginationData(period) {
    pagiResults = period;
    console.log(pagiResults + "   pagination page number");
    indexChange();
}

async function search() {

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

    let query = searchbox.val() + "~" + volume;

    console.log(query);
    // Only run a query if the string contains at least three characters
    if (query.length > 0) {
        // Make the HTTP request with the query as a parameter and wait for the JSON results
        let response_data = await $.get(search_api, { name: query, size: 25 }, 'json');
        console.log(typeof(response_data));

        // Get the part of the JSON response that we care about
        if (response_data.length > 0) {
            loadingdiv.hide();
            noresults.hide();
            // Iterate through the results and write them to HTML
            responseArr = JSON.parse(response_data);
            resultdiv.append('<p class="result-status">Found ' + Object.keys(responseArr.value).length + ' results.</p>');

            console.log(responseArr)
            appendData(resultdiv, responseArr);
        } else {
            noresults.show();
        }
    }
    loadingdiv.hide();
}

//Iterate volume names from API to drop down menu
async function start() {
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
    arr = response.body.split(",");
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


function indexChange() {
    for (var x = 0; x < pagiResults; x++) {
        var y = x * dataLen;
        numArr.push(y);
    }
    numArr = [...new Set(numArr)]
    index = numArr[pagiResults - 1]

    resultdiv.empty();
    resultdiv.append('<p class="result-status">Found ' + Object.keys(responseArr.value).length + ' results.</p>');
    noresults.hide();
    loadingdiv.hide();

    appendData(resultdiv, responseArr);
}

function shareGet(res) {
    shareData = res
}

function applianceData(res) {
    edgeAppliance = res
}


//Appending all the results to the main resultdiv 
function appendData(resultdiv, data) {
    for (var i = index; i < dataLen + index; i++) {
        var link = document.createElement("h5");
        var content = document.createElement("span");
        var resultBox = document.createElement("div");
        var spanDiv = document.createElement('div');
        resultBox.classList.add("result-box");
        spanDiv.classList.add("result-content");
        console.log(shareData)

        if (Object.keys(data.value[0]).length >= 0) {
            console.log(Object.keys(shareData.shares).length)

            file_Share_url = ""
            let sharePathExist = false

            for (var j = 0; j < shareData.shares.length; j++) {
                var locationStr = data.value[i].file_path

                var sharePath = Object.values(shareData.shares[j])[0]

                shareName = Object.keys(shareData.shares[j])[0]

                erpFuncResponse = extractRightPath(locationStr, sharePath)

                if (erpFuncResponse != null) {
                    file_url = file_Share_url
                    file_loc = file_Share_url.trim().replace(/ /g, '%20');
                    sharePathExist = true
                    break
                }

            }

            if (!sharePathExist) {
                let volume = data.value[i].volume_name
                let filePath = data.value[i].file_path.split('destbucket')[1]

                file_loc = "https://" + edgeAppliance + "/fs/view/" + volume + filePath
                file_url = file_loc.trim().replace(/%20/g, ' ');
            }

            link.innerHTML = "<a class='elasti_link result-title' href=" + file_loc + ">" + file_url + "</a><br>";
            resultBox.append(link);

            if (data.value[i].content.length > 0) {
                content.innerHTML += data.value[i].content;
                spanDiv.append(content);
                resultBox.append(spanDiv);
                resultdiv.append(resultBox);
            }

            stop();

        }

        paginationTrigger(data)
    }
}


function paginationTrigger(data) {
    if (pagiResults > 0) {
        var totalPages = data.value.length / dataLen;
        if (totalPages % 1 != 0) {
            totalPages = Math.trunc(totalPages + 1)
        }
        page = Number(pagiResults);
        var paginationDiv = document.getElementById('pagination');
        var ul = document.createElement('ul')
        paginationDiv.append(ul);

        createPagination(totalPages, page);
    }
}

// Matching share path with file path
function extractRightPath(mainString, sharePath) {
    const regex = new RegExp(`(${sharePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(.*)`);
    let matchString = mainString.replace(/%20/g, ' ');
    const match = regex.exec(matchString);

    if (match) {
        rightPart = match[2].trim();
        console.log(rightPart)

        file_Share_url = "https://" + edgeAppliance + "/fs/view/" + shareName + rightPart
        return true
    }

    return null;
}