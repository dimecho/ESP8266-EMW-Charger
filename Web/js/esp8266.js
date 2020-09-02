var i = 1;
var timer;
var formName;

function progressTimer() {
    var progressBar = $('.progress-bar');
    progressBar.css('width', i + '%');
    i++;
    if(i == 100) {
        clearInterval(timer);
        $(formName).submit();
    }
};

function formValidate() {
    WiFiPasswordConfirm.setCustomValidity(WiFiPasswordConfirm.value != WiFiPassword.value ? 'Passwords do not match.' : '');
};

function HiddenCheck(id,element) {
    if(element.checked) {
        $('#' + id).val('1');
    }else{
        $('#' + id).val('0');
    }
};

document.addEventListener('DOMContentLoaded', function(event)
{
    $('#esp8266-flash-select').removeClass('d-none'); //.show();

    var nvram  = new XMLHttpRequest();
    nvram.responseType = 'json';
    nvram.onload = function() {
        if (nvram.status == 200) {
            var js = nvram.response;
            titleVersion(js['nvram'][0]);

            if(js['nvram'][1] == '0') {
                $('#WiFiModeAP').prop('checked', true);
            }else{
                $('#WiFiModeClient').prop('checked', true);
            }
            var bool_value = js['nvram'][2] == '1' ? true : false;
            $('#WiFiHidden').val(js['nvram'][2]);
            $('#WiFiHiddenCheckbox').prop('checked', bool_value);
            
            $('#WiFiPhyMode').val(js['nvram'][3]);
            $('#WiFiPower').val(js['nvram'][4]);
            $('#WiFiChannel').val(js['nvram'][5]);
            $('#WiFiSSID').val(js['nvram'][6]);

            bool_value = js['nvram'][7] == '1' ? true : false;
            $('#EnableLOG').val(js['nvram'][7]);
            $('#EnableLOGCheckbox').prop('checked', bool_value);

            $('#EnableLOGInterval').val(js['nvram'][8]);
            $('.spinner-border').addClass('d-none'); //.hide();
            $('#parameters').removeClass('d-none'); //.show();
        }
    };
    nvram.open('GET', '/nvram', true);
    nvram.send();

    $('#EnableLOGInterval').on('input', function() {
        var v = parseInt(this.value);
        if(v < 10) {
            $.notify({ message: 'Log Interval ' + v + ' is low, Flash may fill up fast!' }, { type: 'warning' });
        }
    });

    $('#fileSPIFFS').change(function() {
        i = 1;
        formName = '#formSPIFFS';

        timer = setInterval(progressTimer, 50);
        //Format SPIFFS
        /*
        $.ajax('/format', {
            success: function success(data) {
                deleteCookie('version');
                $.notify({ message: data }, { type: 'success' });
                $.ajax('/reset', {
                    success: function success(data) {
                        clearInterval(timer);
                        timer = setInterval(progressTimer, 50);
                    }
                });
            }
        });
        */
    });

    $('#fileSketch').change(function() {
        i = 1;
        formName = '#formSketch';

        timer = setInterval(progressTimer, 40);
    });

    $('#browseSPIFFS').click(function(){
        $('#fileSPIFFS').trigger('click');
    });

    $('#browseSketch').click(function(){
        $('#fileSketch').trigger('click');
    });
});