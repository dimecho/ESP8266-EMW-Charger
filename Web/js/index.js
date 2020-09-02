var refreshTimer;
var refreshSpeed = 3000;
var errorNotify = false;
var mainVoltage = 0;
var chargerTimer = 0;
var chargeTimerTick = 0;
var chargeTimerCounter;

document.addEventListener('DOMContentLoaded', function(event)
{
    var nvram = new XMLHttpRequest();
    nvram.responseType = 'json';
    nvram.onload = function() {
        if (nvram.status == 200) {
            var js = nvram.response;
            titleVersion(js['nvram'][0]);
            chargerTimer = js['nvram'][12];
            if(js['nvram'][9] != '0')
            	$('#voltage').val(js['nvram'][9]);
            if(js['nvram'][10] != '0')
            	$('#current').val(js['nvram'][10]);
            if(js['nvram'][11] != '0')
            	$('#crc').val(js['nvram'][11]);
        }
    };
    nvram.open('GET', '/nvram', true);
    nvram.send();
});

function initializeSerial() {

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
           if (xhr.status == 200) {
                var data = xhr.responseText;

                console.log(data);
                if(data.toUpperCase().indexOf('OK') != -1)
                {
                    $('#refreshSpeed').ionRangeSlider({
                        skin: 'big',
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
                    $('#com').removeClass('d-none'); //.show();
                }
            }else{
                console.log(xhr.status);
                console.log(xhr.responseText);
            }
        }
    };
    //xhr.open('GET', 'serial.php?init=115200', true);
    xhr.open('GET', 'serial.php?init=19200', true);
    xhr.send();

    $('#current').change(function() {
    	var vvv = parseInt($('#voltage').val());
		var ccc = parseInt($('#current').val());
    	$('#crc').val(ccc+vvv); //%1000
	});
};

function timerCharger() {
    var myModal = new bootstrap.Modal(document.getElementById('chargerTimerModal'), {});
    myModal.show();

    $('#timer-Slider').roundSlider({
        value: chargerTimer,
        //svgMode: true,
        radius: 280,
        width: 32,
        handleSize: '+64',
        handleShape: 'dot',
        sliderType: 'min-range',
        min: 0,
        max: 30,
        change: function (args) {
            chargerTimer = args.value;
            saveSetting(12, args.value);
        }
    });
};

function startCharger() {

    var opStatus = $('#opStatus');

	var vvv = $('#voltage').val();
	var ccc = $('#current').val();
	var crc = $('#crc').val();

	if(vvv == '' || ccc == '' || crc == '') {
		$.notify({ message: 'Input fields cannot be empty' }, { type: 'danger' });
		return;
    }else if (isInt(parseInt(ccc)) == false) { //}else if (isFloat(parseFloat(ccc)) == false) {
        $.notify({ message: 'Input Current must be a number' }, { type: 'danger' });
        return;
    }else if (isInt(parseInt(vvv)) == false) {
        $.notify({ message: 'Input Voltage must be a number' }, { type: 'danger' });
        return;
	}else if (isInt(parseInt(crc)) == false) {
		$.notify({ message: 'Input CRC must be a number' }, { type: 'danger' });
		return;
	}

	vvv = '00' + vvv;
	ccc = '00' + ccc.replace('.','');
	crc = '00' + crc;

	vvv = vvv.substr(vvv.length - 3);
	ccc = ccc.substr(ccc.length - 3);
	crc = crc.substr(crc.length - 3);

    saveSetting(9, vvv);
    saveSetting(10, ccc);
    saveSetting(11, crc);

    if(chargerTimer == 0)
    {
        $.notify({ message: 'M,' + ccc +',' + vvv + ',' + crc + ',E' }, { type: 'success' });

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
               if (xhr.status == 200) {
                    console.log(xhr.responseText);
                    $('#com').addClass('d-none'); //.hide();
                    errorNotify = false;
               }else{
                    console.log(xhr.status);
                    console.log(xhr.responseText);
                    $.notify({ message: xhr.responseText }, { type: 'warning' });
               }
            }
        };
        xhr.open('GET', 'serial.php?command=M,' + ccc + ',' + vvv + ',' + crc + ',E', true);
        xhr.send();
    }else{
        $.notify({ message: 'Charger is on Timer' }, { type: 'warning' });

        opStatus.empty();
        opStatus.append($('<h2>',{ class: 'text-warning' }));

        chargeTimerTick = chargerTimer * 60;
        chargeTimerCounter = setInterval(timerStatus, 1000);


        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/start', true);
        xhr.send();
    }
};

function timerStatus() {

    chargeTimerTick--;

    if (chargeTimerTick === 0) {
        var opStatus = $('#opStatus');
        var st = $('<h2>',{ class: 'text-success' }).append('STARTED BY TIMER');
        opStatus.empty();
        opStatus.append(st);
        clearInterval(chargeTimerCounter);
    }else{
        var minutes = Math.floor(chargeTimerTick / 60);
        var seconds = chargeTimerTick - minutes * 60;
        $('#opStatus h2').text('STARTING IN ' + minutes + ' MIN ' + seconds + ' SEC');
    }
};

function stopCharger() {

    clearInterval(chargeTimerCounter);

	var opStatus = $('#opStatus');

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
           if (xhr.status == 200) {
                console.log(xhr.responseText);

                //clearTimeout(refreshTimer);

                $.notify({ message: 'Charging Stopped!' }, { type: 'danger' });

                var st = $('<h2>',{ class: 'text-warning' }).append('WAITING');
                opStatus.empty();
                opStatus.append(st);

                mainVoltage = 0;
           }else{
                console.log(xhr.status);
                console.log(xhr.responseText);
                $.notify({ message: xhr.responseText }, { type: 'warning' });
           }
        }
    };
    xhr.open('GET', 'serial.php?command=M,001,000,001,E', true);
    xhr.send();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/stop', true);
    xhr.send();
};

function getChargerState() {

	var opStatus = $('#opStatus');
	var chargerStatus = $('#chargerStatus');
	var chargerValues = $('#chargerValues');

    var xhr = new XMLHttpRequest();
    xhr.timeout = refreshSpeed + 200;
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
           if (xhr.status == 200) {
                var data = xhr.responseText;
                console.log(data);

                if (data == '' && errorNotify == false) {
                    errorNotify = true;
                    $.notify({ message: 'Try swapping TX <-> RX' }, { type: 'warning' });
                    $('#com').removeClass('d-none'); //.show();
                    return;
                }
                /*
                if (data.indexOf('\n') != -1) { //multi line stream
                    var d = data.split('\n');
                    data = d[d.length-1]; //last one
                }
                */
                if (data.indexOf('M,') != -1) {
                    
                    var s = data.split(',');
                    var info = '';

                    if(mainVoltage != 0)
                        info += 'Main Voltage: ' + mainVoltage + 'V<br/>';

                    for(var i = 0; i < s.length; i++) {
                        if(s[i].indexOf('R') != -1) {
                            opStatus.empty();
                            opStatus.append($('<h2>',{ class: 'text-success' }).append('READY'));
                        }else if(s[i].indexOf('D') != -1) {
                            opStatus.empty();
                            opStatus.append($('<h2>',{ class: 'text-danger' }).append('CHARGING ' + parseInt(s[i].replace('D', '')) + '%'));
                        }else if(s[i].indexOf('M') != -1) {
                            var v = parseInt(s[i].replace('M', ''));
                            if(isNaN(v)) { continue; }
                                mainVoltage = v;
                        }else if(s[i].indexOf('V') != -1) {
                            var v = parseInt(s[i].replace('V', ''));
                            info += 'Voltage Output: ' + v + 'V<br/>';
                        }else if(s[i].indexOf('C') != -1) {
                            var v = parseInt(s[i].replace('C', ''))/10;
                            info += 'Current: ' + v + 'A<br/>';
                        }else if(s[i].indexOf('c') != -1) {
                            var v = parseInt(s[i].replace('c', ''));
                            info += 'Current Setting: ' + v + 'A<br/>';
                        }else if(s[i].indexOf('v') != -1) {
                            var v = parseInt(s[i].replace('v', ''));
                            info += 'Voltage Setting: ' + v + 'V<br/>';
                        }else if(s[i].indexOf('T') != -1) {
                            var v = parseInt(s[i].replace('T', ''));
                            info += 'Heatsink Temp: ' + v + 'C<br/>';
                        }else if(s[i].indexOf('O') != -1) {
                            var v = parseInt(s[i].replace('O', ''));
                            info += 'Output Charge: ' + v + 'AH<br/>';
                        }
                    }
                    chargerValues.empty();
                    chargerValues.append(info);
                    chargerStatus.removeClass('d-none');
                }
            }else{
                console.log(xhr.status);
                console.log(xhr.responseText);
                //$.notify({ message: xhr.responseText }, { type: 'warning' });
           }
        }
    };
    xhr.open('GET', 'serial.php?get=status', true);
    xhr.send();
    
	refreshTimer = setTimeout(function () {
        getChargerState();
    }, refreshSpeed);
};

function saveSetting(offset, value) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/nvram?offset=' + offset + '&value=' + value, true);
    xhr.send();
};

function isInt(n) {
    return Number(n) === n && n % 1 === 0;
};

function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
};