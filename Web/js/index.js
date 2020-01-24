var refreshTimer;
var refreshSpeed = 3000;
var errorNotify = false;
var mainVoltage = 0;

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

	$.notify({ message: "M," + ccc +"," + vvv + "," + crc + ",E" }, { type: "success" });

	$.ajax("serial.php?command=M," + ccc + "," + vvv + "," + crc + ",E", {
        async: true,
        success: function(data) {
            console.log(data);

            $("#com").addClass("d-none"); //.hide();
            errorNotify = false;
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
        async: true,
        success: function(data) {
            console.log(data);

            //clearTimeout(refreshTimer);

            $.notify({ message: 'Charging Stopped!' }, { type: 'danger' });

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
        timeout: refreshSpeed + 200,
        success: function(data) {
            console.log(data);

            if (data == "" && errorNotify == false) {
            	errorNotify = true;
            	$.notify({ message: "Try swapping TX <-> RX" }, { type: "warning" });
            	$("#com").removeClass("d-none"); //.show();
            	return;
        	}
            /*
            if (data.indexOf("\n") != -1) { //multi line stream
        		var d = data.split('\n');
        		data = d[d.length-1]; //last one
        	}
            */
            if (data.indexOf("M,") != -1) {
            	
            	var s = data.split(',');
            	var info = "";

                if(mainVoltage != 0)
                    info += "Main Voltage: " + mainVoltage + "V<br/>";

            	for(var i = 0; i < s.length; i++) {
					if(s[i].indexOf("R") != -1) {
				    	opStatus.empty();
                		opStatus.append($("<h2>",{ class: "text-success" }).append("READY"));
                	}else if(s[i].indexOf("D") != -1) {
				    	opStatus.empty();
                		opStatus.append($("<h2>",{ class: "text-danger" }).append("CHARGING " + parseInt(s[i].replace("D", "")) + "%"));
				    }else if(s[i].indexOf("M") != -1) {
				    	var v = parseInt(s[i].replace("M", ""));
                        if(isNaN(v)) { continue; }
                            mainVoltage = v;
				    }else if(s[i].indexOf("V") != -1) {
				    	var v = parseInt(s[i].replace("V", ""));
				    	info += "Voltage Output: " + v + "V<br/>";
				    }else if(s[i].indexOf("C") != -1) {
				    	var v = parseInt(s[i].replace("C", ""))/10;
				    	info += "Current: " + v + "A<br/>";
				    }else if(s[i].indexOf("c") != -1) {
				    	var v = parseInt(s[i].replace("c", ""));
				    	info += "Current Setting: " + v + "A<br/>";
				    }else if(s[i].indexOf("v") != -1) {
				    	var v = parseInt(s[i].replace("v", ""));
				    	info += "Voltage Setting: " + v + "V<br/>";
				    }else if(s[i].indexOf("T") != -1) {
				    	var v = parseInt(s[i].replace("T", ""));
				    	info += "Heatsink Temp: " + v + "C<br/>";
				    }else if(s[i].indexOf("O") != -1) {
				    	var v = parseInt(s[i].replace("O", ""));
				    	info += "Output Charge: " + v + "AH<br/>";
				    }
				}
				chargerValues.empty();
				chargerValues.append(info);
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