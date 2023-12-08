var data;
var result=[];
var volumes = [];
var services = [];
var rowIndex = 0;
var source;
var schedulerName="";
var trackerDoc = schedulerName+"_tracker.json";

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

//usage:
function trackerStart(){
    readTextFile(trackerDoc, function(text){
        ssoGet()       
        data = JSON.parse(text);
        result = Object.keys(data).map((key) => [Number(key), data[key]]);
        console.log(data.INTEGRATIONS);
        dataArr = result[0][1];
        console.log(dataArr)
        volumes = Object.keys(result[0][1])
        console.log(volumes)
        tableAppend(result,volumes);

        
    });
}

function ssoGet(res){
    ssoData=res
}

function tableAppend(result,volumes) {
        volumes = Object.keys(result[0][1])
        volumes = [...new Set(volumes)]
        source = Object.values(result[0][1])
        console.log(source)
        for(i=0;i<volumes.length;i++){
            var tbodyRef = document.getElementById("dataTable").getElementsByTagName("tbody")[0];
            var newRow = tbodyRef.insertRow();
            for(j=0;j<4;j++){
                var newCell = newRow.insertCell();
                
                if(j==1){
                    
                    var listServices = document.createTextNode(source[i]._source.service);
                    newCell.appendChild(listServices);
                } else if(j==2){
                    var listStatus = document.createTextNode(source[i]._NAC_activity.current_state);
                    newCell.appendChild(listStatus);
                } else if(j==3){
                    var listSchedule = document.createTextNode(source[i]._source.frequency);
                    newCell.appendChild(listSchedule);
                }else{
                    var a = document.createElement('a');
                    let button = document.createElement('button');
                    var link = document.createTextNode(source[i]._source.volume);
                    var volumeName=source[i]._source.volume
                    a.setAttribute("id","anchor");
                    button.appendChild(a)
                    a.appendChild(link)
                    a.href=source[i]._source.default_url+"?q="+source[i]._source.volume
                    a.target = "_blank";
                    handleJsonFile();
                    a.onclick=function(){
                    if(ssoData[volume]!="undefined") { 
                    ssoTrigger(ssoData[volumeName])
                    }
                }
                    newCell.appendChild(a);
                }
   
            }
        }
    }



