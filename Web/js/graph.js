var json = {};
var lineWidth = 1;

var chart_charge_datasets = [{
	type: "line",
	id: "volts",
	label: "Volts",
	backgroundColor: "rgba(255,99,132,0.2)",
	borderColor: "rgba(255,99,132,1)",
	borderWidth: lineWidth,
	hoverBackgroundColor: "rgba(255,99,132,0.4)",
	hoverBorderColor: "rgba(255,99,132,1)",
	data: [0],
	yAxisID: "y-axis-0"
}, {
	type: "line",
	id: "current",
	label: "Current",
	backgroundColor: "rgba(102, 255, 51, 0.2)",
	borderColor: "rgba(0,0,0,0.2)",
	borderWidth: lineWidth,
	hoverBackgroundColor: "rgba(102, 255, 51, 0.4)",
	hoverBorderColor: "rgba(0,0,0,0.5)",
	data: [0],
	yAxisID: "y-axis-1"
}];

var zoomFactor = 1;
var graphDivision = 60;
var streamLoop = 1;
var pageLimit = 4;
var streamTimer;
var data = {};
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

    if(os === "mobile") {
        Chart.defaults.global.animationSteps = 0;
        canvas.height = 800;
        ctxFont = 40;
    }else{
        Chart.defaults.global.animationSteps = 12;
        canvas.height = 640;
    }

    buildGraphMenu();

    initChart();
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

    var min = 1;
	var max = 100;
	var step = 1;

    var y_axis = {
        display: visible,
        id: id,
        position: side,
        scaleLabel: {
        	display: true,
        	fontColor: ctxFontColor,
            fontSize: ctxFont,
            labelString: label //datasets[1].label
        },
        ticks: {
        	fontColor: ctxFontColor,
            fontSize: ctxFont,
            stepSize: step,
            suggestedMin: min, //auto scale
            suggestedMax: max //auto scale
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

function buildGraphMenu() {
    //os = "mobile";

    var menu = $("#buildGraphMenu"); //.empty();
    var menu_buttons = $("#buildGraphButtons"); //.empty();
    var export_buttons = $("#buildGraphExport"); //.empty();

	var btn_points_i = $("<i>", { class: "icons icon-ok" });
    var e_img = $("<i>", { class: "icons icon-status icon-png p-2", onClick: "exportPDF()", "data-toggle": "tooltip", "title": "Export Image" });
    var e_csv = $("<i>", { class: "icons icon-status icon-csv p-2", onClick: "exportCSV()", "data-toggle": "tooltip", "title": "Export CSV" });

    export_buttons.append(e_img);

    if (os === "mobile") {

        graphDivision = 40;
    }else{
        export_buttons.append(e_csv);
    }

    $('[data-toggle="tooltip"]').tooltip();
};

function exportCSV() {

    var datasets = activeDatasets();
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

    data = {};
    options = {};

    var duration = 0;

    if(os !== "mobile")
        duration = syncronizedDelay/2;

    initChargeChart(duration);

    if (chart) chart.destroy();

	//Chart.defaults.global.elements.line.tension = 0;
	//Chart.defaults.global.animation.duration = 800;
	
    chart = new Chart(ctx, {
        type: 'line',
        //type: 'bar',
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

function initChargeChart(duration) {

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
        },
        plugins: {
            datalabels: {
            	color: ctxFontColor,
                font: ctxFont,
	            align: 'top',
	            display: showDataLabels,
	            backgroundColor: function(context) {
					return context.dataset.backgroundColor;
				}
            }
        }
    };

    addYAxis(chart_motor_datasets,options);
};