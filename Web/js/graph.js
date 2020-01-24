var lineWidth = 2;

var chart_charge_datasets = [{
	type: "line",
	id: "Volts",
	label: "Volts",
    fill: false,
	backgroundColor: "rgba(255,99,132,0.2)",
	borderColor: "rgba(255,99,132,1)",
	borderWidth: lineWidth,
	data: [],
	yAxisID: "y-axis-0"
}, {
	type: "line",
	id: "Current",
	label: "Current",
    fill: false,
    backgroundColor: "rgba(52,152,219,0.2)",
    borderColor: "rgba(52,152,219,1)",
    borderWidth: lineWidth,
	data: [],
	yAxisID: "y-axis-1"
}];

var graphDivision = 60;
var streamTimer;
var data = {};
var options = {};
var chart;
var ctxAxis;
var ctx;
var ctxFont = 12;
var ctxFontColor = "black";
var ctxGridColor = "#BEBEBE";

$(document).ready(function () {

    graphTheme();
 
    var canvas = document.getElementById("chartCanvas");
    ctx = canvas.getContext("2d");
	ctxAxis = document.getElementById("chartAxis").getContext("2d");

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        graphDivision = 40;

        Chart.defaults.global.animationSteps = 0;
        //Chart.defaults.global.elements.line.tension = 0;
        //Chart.defaults.global.animation.duration = 800;

        canvas.height = 800;
        ctxFont = 40;
    }else{
        Chart.defaults.global.animationSteps = 12;
        canvas.height = 640;
    }

    initChart();

    $.ajax("/nvram", {
        dataType: 'json',
        success: function success(data) {
            console.log(data);
            bool_value = data["nvram5"] == "1" ? true : false;
            if(bool_value == false) {
                $.notify({ message: "Data Collection is Disabled in <a href='esp8266.php'>ESP8266</a>" }, { type: "warning" });
            }
        }
    });
});

function graphTheme() {

	if(theme == ".slate") {
        ctxFontColor = "white";
        ctxGridColor = "#707070";           
    }
};

function addYAxis(datasets,options) {

    for (var i = 0, l = datasets.length; i < l; i++) {
        if(i == 0) {
            newYAxis(datasets[i].id,datasets[i].yAxisID,options,"left",true);
        }else if (i == 1) {
            newYAxis(datasets[i].id,datasets[i].yAxisID,options,"right",true);
        }else{
        	//newYAxis(datasets[i].id,datasets[i].yAxisID,options,"left",true); //DEBUG
            newYAxis(datasets[i].id,datasets[i].yAxisID,options,"left",false);
        }
    }
};

function newYAxis(key,id,options,side,visible) {

    var y_axis = {
        display: visible,
        id: id,
        position: side,
        scaleLabel: {
        	display: true,
        	fontColor: ctxFontColor,
            fontSize: ctxFont,
            labelString: key
        },
        ticks: {
        	beginAtZero: false,
        	fontColor: ctxFontColor,
            fontSize: ctxFont,
            stepSize: 1,
            suggestedMin: 1, //auto scale
            suggestedMax: 10 //auto scale
        },
        gridLines: {
            drawOnChartArea: visible,
			color: ctxGridColor,
			zeroLineColor: ctxFontColor
            //zeroLineWidth: 2
        }
    };

    options.scales.yAxes.push(y_axis);
    //console.log(options);
};

function exportPNG() {

    var render = ctx.canvas.toDataURL("image/png", 1.0);
    var d = new Date();

    var data = atob(render.substring("data:image/png;base64,".length)),
        asArray = new Uint8Array(data.length);

    for (var i = 0, len = data.length; i < len; ++i) {
        asArray[i] = data.charCodeAt(i);
    }
    var blob = new Blob([asArray.buffer], { type: "image/png" });

    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "graph " + d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " + (d.getHours() % 12 || 12) + "-" + d.getMinutes() + " " + (d.getHours() >= 12 ? 'pm' : 'am') + ".png";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
};

function exportRAW() {
    var link = document.createElement("a");
    link.setAttribute("href", "data.txt");
    link.setAttribute("download", "data.txt");
    document.body.appendChild(link); // Required for FF
    link.click();
};

function exportCSV() {

    var datasets = chart_charge_datasets;
    var points = idDatasets(datasets);
    var value = csvDatasets(datasets);

    //console.log(value);

    let csvContent = "data:text/csv;charset=utf-8,";

    let row = value[0].length;
    let col = points.length;

    for (var r = 0; r < row; r++) {
        if(r == 0) { //first row
            csvContent += points.join(",") + "\r\n";
        }
        for (var c = 0; c < col; c++) {
            //TODO: get timestamp
            csvContent += value[c][r] + ",";
        }
        csvContent += "\r\n";
    }

    //var encodedUri = encodeURI(csvContent);
    //window.open(encodedUri);

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
};

function initChart() {

    data = {
        labels: initTimeAxis(graphDivision),
        datasets: chart_charge_datasets
    };

    options = {
        legend: {
            labels: {
                fontColor: ctxFontColor,
                fontSize: ctxFont
            }
        },
        elements: {
            point: {
                radius: 0
            }
        },
        tooltips: {
            enabled: false
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                position: 'bottom',
                scaleLabel: {
                    fontColor: ctxFontColor,
                    fontSize: ctxFont,
                    labelString: 'Time (hh:mm:ss)'
                },
                ticks: {
                	beginAtZero: true,
                    fontColor: ctxFontColor,
                    fontSize: ctxFont,
                    maxRotation: 90,
                    reverse: false
                },
                gridLines: {
                  color: ctxGridColor
                }
            }],
            yAxes: [] //Dynamically added
        }
    };
	
    $.ajax("data.txt", {
        async: false,
        success: function success(logs) {
            var line = logs.split('\n');

            data.labels = initTimeAxis(line.length);

            for(var i = 0; i < line.length; i++) {
                var s = line[i].split(',');
                for(var x = 0; x < s.length; x++) {
                    if(s[x].indexOf("V") != -1) {
                        var v = parseInt(s[x].replace("V", ""));
                        chart_charge_datasets[0].data.push(v);
                    }else if(s[x].indexOf("C") != -1) {
                        var v = parseFloat(s[x].replace("C", ""))/10;
                        chart_charge_datasets[1].data.push(v);
                    }
                }
            }
        }, error: function (data, textStatus, errorThrown) {
            console.log(textStatus);
            console.log(data);
        }
    });

    addYAxis(chart_charge_datasets,options);

	options.scales.yAxes[0].ticks.suggestedMax = chart_charge_datasets[0].data.max()*1.1;
	options.scales.yAxes[1].ticks.suggestedMax = chart_charge_datasets[1].data.max()*1.1;

    chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
    //chart.update();

    $('.chartAreaWrapper2').width($('.chartAreaWrapper').width());
};

function idDatasets(dataset) {
	ids = [];
	for (var i = 0, l = dataset.length; i < l; i++) {
		if(dataset[i].id)
			ids.push(dataset[i].id);
	}
	console.log(ids);
	return ids;
};

function csvDatasets(dataset) {
    row = [];
    for (var i = 0, l = dataset.length; i < l; i++) {
        row.push(dataset[i].data);
    }
    console.log(row);
    return row;
};

function initTimeAxis(seconds, labels, stamp) {

    var xaxis = [];

    if(labels)
        xaxis = labels;

    for (var i = 0; i < seconds; i++) {
    	if (stamp != undefined) {
    		if (stamp == 0) {
	    		xaxis.push(i);
	    	}else{
	    		if (i % 10 == 0) {
		    		if (stamp == 1) {
		    			xaxis.push(i);
		    		}else{
		    			xaxis.push(i + " " + stamp);
		    		}
	    		}
    		}
    	}else{
    		xaxis.push("");
    	}
        /*
        if (i / 10 % 1 != 0) {
            xaxis.push("");
        } else {
            xaxis.push(i);
        }
        */
        //xaxis.push(i.toString());
    }
    return xaxis;
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};