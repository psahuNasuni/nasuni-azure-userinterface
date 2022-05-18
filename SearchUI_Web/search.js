// Update this variable to point to your domain.
var search_api = "https://nasuni-function-app-aaccb06bbe87.azurewebsites.net/api/SearchFunction"; 
var volume_api = "https://nasuni-function-app-aaccb06bbe87.azurewebsites.net/api/SearchFunction"; 
var loadingdiv = $('#loading');
var noresults = $('#noresults');
var resultdiv = $('#results');
var searchbox = $('input#search');
var timer = 0;
var arr = [];
var responseArr = [];
var volume;
var volSelect;
let pagiResults = 1;
var dataLen = 3;
var index = 0;
var numArr = []

// Executes the search function 250 milliseconds after user stops typing
searchbox.keyup(function() {
    clearTimeout(timer);
    timer = setTimeout(search, 500);
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
        let response_data = await $.get(apigatewayendpoint, { q: query, size: 25 }, 'json');
        console.log(response_data);

        // Get the part of the JSON response that we care about
        if (response_data.length > 0) {
            loadingdiv.hide();
            noresults.hide();
            // Iterate through the results and write them to HTML
            resultdiv.append('<p class="result-status">Found ' + response_data.length + ' results.</p>');
            responseArr = response_data;
            appendData(resultdiv, responseArr);
        } else {
            noresults.show();
        }
    }
    loadingdiv.hide();
}

//Iterate volume names from API to drop down menu
async function start() {
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
    arr = response.split(",");
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
    resultdiv.append('<p class="result-status">Found ' + responseArr.length + ' results.</p>');
    noresults.hide();
    loadingdiv.hide();

    appendData(resultdiv, responseArr);
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

        if (data[i].length >= 0) {

            for (var j = 0; j < data[i].length; j++) {
                link.innerHTML = "<a class='elasti_link result-title' href=" + data[i][j]._source.access_url + ">" + data[i][j]._source.object_key + "</a>" + "<br>";
                resultBox.append(link);
                if (data[i][j].content.length > 0) {
                    for (var k = 0; k < data[i][j].content.length; k++) {
                        content.innerHTML += data[i][j].content[k];

                        spanDiv.append(content);
                        resultBox.append(spanDiv);
                    }
                    resultdiv.append(resultBox);

                }
                // if (data[i][j].highlight.content.length > 0) {
                //     for (var k = 0; k < data[i][j].highlight.content.length; k++) {
                //         content.innerHTML += data[i][j].highlight.content[k];

                //         spanDiv.append(content);
                //         resultBox.append(spanDiv);
                //     }
                //     resultdiv.append(resultBox);

                // }
            }

            stop();

        }
        paginationTrigger(data)
    }


}

function paginationTrigger(data) {
    if (pagiResults > 0) {
        var totalPages = data.length / dataLen;
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
