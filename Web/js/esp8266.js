var i = 1;
var timer;
var formName;

function progressTimer() {
    var progressBar = $(".progress-bar");
    progressBar.css("width", i + "%");
    i++;
    if(i == 100) {
        clearInterval(timer);
        $(formName).submit();
    }
};

function formValidate() {
    WiFiPasswordConfirm.setCustomValidity(WiFiPasswordConfirm.value != WiFiPassword.value ? "Passwords do not match." : "");
};

function HiddenCheck(id,element) {
    if(element.checked) {
        $("#" + id).val("1");
    }else{
        $("#" + id).val("0");
    }
};

$(document).ready(function() {
    
    $("#esp8266-flash-select").removeClass("d-none"); //.show();

    $.ajax("/nvram", {
        dataType: 'json',
        success: function success(data) {
            console.log(data);
            if(data["nvram0"] == "0") {
                $("#WiFiModeAP").prop("checked", true);
            }else{
                $("#WiFiModeClient").prop("checked", true);
            }
            var bool_value = data["nvram1"] == "1" ? true : false;
            $("#WiFiHidden").val(data["nvram1"]);
            $("#WiFiHiddenCheckbox").prop("checked", bool_value);
            $("#WiFiChannel").val(data["nvram2"]);
            $("#WiFiSSID").val(data["nvram3"]);

            bool_value = data["nvram5"] == "1" ? true : false;
            $("#EnableLOG").val(data["nvram5"]);
            $("#EnableLOGCheckbox").prop("checked", bool_value);

            $("#EnableLOGInterval").val(data["nvram6"]);
            $(".spinner-border").addClass("d-none"); //.hide();
            $("#parameters").removeClass("d-none"); //.show();
        }
    });

    $("#EnableLOGInterval").on("input", function() {
        var v = parseInt(this.value);
        if(v < 10) {
            $.notify({ message: "Log Interval " + v + " is low, Flash may fill up fast!" }, { type: "warning" });
        }
    });

    $("#fileSPIFFS").change(function() {
        i = 1;
        formName = "#formSPIFFS";

        timer = setInterval(progressTimer, 250);
        //Format SPIFFS
        $.ajax("/format", {
            success: function success(data) {
                deleteCookie("version");
                $.notify({ message: data }, { type: "success" });
                $.ajax("/reset", {
                    success: function success(data) {
                        clearInterval(timer);
                        timer = setInterval(progressTimer, 50);
                    }
                });
            }
        });
        
    });

    $("#fileSketch").change(function() {
        i = 1;
        formName = "#formSketch";

        timer = setInterval(progressTimer, 40);
    });

    $("#browseSPIFFS").click(function(){
        $("#fileSPIFFS").trigger("click");
    });

    $("#browseSketch").click(function(){
        $("#fileSketch").trigger("click");
    });
});