var refreshTimer;
var refreshSpeed = 3000;

function initializeSerial() {

    //$.ajax("serial.php?init=115200", {
    $.ajax("serial.php?init=19200", {
        async: true,
        success: function(data) {
            console.log(data);
            if(data.toUpperCase().indexOf("OK") != -1)
            {
            	$("#refreshSpeed").ionRangeSlider({
			        skin: "big",
			        //grid: true,
			        min: 100,
			        max: 2000,
			        from: refreshSpeed,
			        step: 100,
			        onChange: function (e) {
			            refreshSpeed = e.from;
			        }
			    });
            	getChargerState();
            }else{
            	$.notify({ message: 'Serial speed incorrect, Power cycle' }, { type: 'danger' });
                $("#com").removeClass("d-none"); //.show();
            }
        }, error: function (data, textStatus, errorThrown) { //only for Windows (blocking UART)
        	console.log(textStatus);
        	console.log(data);
            $.notify({ message: "Try swapping TX <-> RX" }, { type: "warning" });
            $("#com").removeClass("d-none"); //.show();
        }
    });

    $("#current").change(function() {
    	var vvv = parseInt($("#voltage").val());
		var ccc = parseInt($("#current").val());
    	$("#crc").val(ccc+vvv); //%1000
	});
};

function startCharger() {

	var vvv = $("#voltage").val();
	var ccc = $("#current").val();
	var crc = $("#crc").val();

	if(vvv == "" || ccc == "" || crc == "")
	{
		$.notify({ message: "Fillout all input fields." }, { type: "danger" });
		return;
	}

	$.notify({ message: "M," + vvv +"," + ccc + "," + crc + ",E" }, { type: "success" });

	$.ajax("serial.php?command=M," + vvv + "," + ccc + "," + crc + ",E", {
        async: false,
        success: function(data) {
            console.log(data);
        }, error: function (data, textStatus, errorThrown) { //only for Windows (blocking UART)
        	console.log(textStatus);
        	console.log(data);
            $.notify({ message: data }, { type: "warning" });
        }
    });
};

function stopCharger() {
	var opStatus = $("#opStatus");

	$.ajax("serial.php?command=M,001,000,001,E", {
        async: false,
        success: function(data) {
            console.log(data);

            clearTimeout(refreshTimer);

            var st = $("<h2>",{ class: "text-warning" }).append("WAITING");
        	opStatus.empty();
            opStatus.append(st);

        }, error: function (data, textStatus, errorThrown) { //only for Windows (blocking UART)
        	console.log(textStatus);
        	console.log(data);
            $.notify({ message: data }, { type: "warning" });
        }
    });
};

function getChargerState() {

	var opStatus = $("#opStatus");
	var chargerStatus = $("#chargerStatus");
	var chargerValues = $("#chargerValues");

	$.ajax("serial.php?get=status", {
        async: true,
        timeout: refreshSpeed + 100,
        success: function(data) {
            console.log(data);

            if (data.indexOf("\n") != -1) { //multi line stream
        		var d = data.split('\n');
        		data = d[d.length-1]; //last one
        	}

            if (data.indexOf("M,") != -1) {
            	chargerValues.empty();
            	var s = data.replace("M,", "").split(',');
            	for(var i = 0; i < s.length; i++) {
					if(s[i].indexOf("R") != -1) {
				    	opStatus.empty();
                		opStatus.append($("<h2>",{ class: "text-success" }).append("READY"));
                	}else if(s[i].indexOf("D") != -1) {
				    	opStatus.empty();
                		opStatus.append($("<h2>",{ class: "text-danger" }).append("CHARGING " + parseInt(s[i].replace("D", "")) + "%"));
				    }else if(s[i].indexOf("M") != -1) {
				    	var v = parseInt(s[i].replace("M", ""));
				    	chargerValues.append("Main Voltage: " + v + "V<br/>");
				    }else if(s[i].indexOf("V") != -1) {
				    	var v = parseInt(s[i].replace("V", ""));
				    	chargerValues.append("Voltage Output: " + v + "V<br/>");
				    }else if(s[i].indexOf("C") != -1) {
				    	var v = parseInt(s[i].replace("C", ""));
				    	chargerValues.append("Current: " + v + "A<br/>");
				    }else if(s[i].indexOf("c") != -1) {
				    	var v = parseInt(s[i].replace("c", ""));
				    	chargerValues.append("Current Setting: " + v + "A<br/>");
				    }else if(s[i].indexOf("v") != -1) {
				    	var v = parseInt(s[i].replace("v", ""));
				    	chargerValues.append("Voltage Setting: " + v + "V<br/>");
				    }else if(s[i].indexOf("T") != -1) {
				    	var v = parseInt(s[i].replace("T", ""));
				    	chargerValues.append("Heatsink Temp: " + v + "C<br/>");
				    }else if(s[i].indexOf("O") != -1) {
				    	var v = parseInt(s[i].replace("O", ""));
				    	chargerValues.append("Output Charge: " + v + "AH<br/>");
				    }
				}
            	chargerStatus.removeClass("d-none");
        	}
        }, error: function (data, textStatus, errorThrown) {
        	console.log(textStatus);
        	console.log(data);
            //$.notify({ message: data }, { type: "warning" });
        }
    });
	refreshTimer = setTimeout(function () {
        getChargerState();
    }, refreshSpeed);
};