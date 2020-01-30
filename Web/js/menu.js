var theme = detectTheme();
loadTheme();

var serialTimeout = 12000;
var statusRefreshTimer;

$(document).ready(function () {

    var version = getCookie("version") || 0;
    if (version == 0) {
        $.ajax("version.txt", {
            success: function(version) {
				version = version.replace("\n", ".");
                setCookie("version", version, 1);
                titleVersion(version);
            }
        });
    }
    titleVersion(version);

    buildMenu();
});

function titleVersion(version)
{
    document.title = "EMW Charger Console (" + version + ")"
};

function setDefaultValue(value, defaultValue){
   return (value === undefined) ? defaultValue : value.value;
};

function isInt(n){
    return Number(n) === n && n % 1 === 0;
};

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
};

function sendCommand(cmd) {

    var e = ""
  
    //$.ajax(serialWDomain + ":" + serialWeb + "/serial.php?command=" + cmd, {
    $.ajax("serial.php?command=" + cmd, {
        async: false,
        cache: false,
        timeout: serialTimeout,
        success: function success(data) {
            //console.log(cmd);
            //console.log(data);
            if(cmd == "json") {
                try {
                    e = JSON.parse(data);
                } catch(ex) {
                    e = {};
                    $.notify({ message: ex + ":" + data }, { type: 'danger' });
                }
            }else{
                e = data;
            }
        },
        error: function error(xhr, textStatus, errorThrown) {}
    });
    return e;
};

function getJSONFloatValue(value, callback) {

    var f = 0;
    var sync = false;

    if(callback)
        sync = true;

    //$.ajax(serialWDomain + ":" + serialWeb + "/serial.php?get=" + value, {
    $.ajax("serial.php?get=" + value, {
        async: sync,
        timeout: serialTimeout,
        success: function success(data) {
            //console.log(data);
            f = parseFloat(data);
            if(isNaN(f))
                f = 0;
            if(callback)
                callback(f);
        }
    });
    //console.log(f);
    return f;
};

function buildMenu() {

    var file = "js/menu.json";

    $.ajax(file, {
        dataType: 'json',
        success: function success(js) {

            //console.log(js);

            var nav = $("#mainMenu");
            var wrap = $("<div>", { class: "container" }); // { class: "d-flex mx-auto" });
            
            var button = $("<button>", { class: "navbar-toggler navbar-toggler-right", type: "button", "data-toggle":"collapse", "data-target": "#navbarResponsive", "aria-controls": "navbarResponsive", "aria-expanded": false, "aria-label": "Menu" });
            var span = $("<span>", { class: "icons icon-menu" }); //navbar-toggler-icon" });
            button.append(span);
			wrap.append(button);

			var div = $("<div>", { class: "collapse navbar-collapse", id:"navbarResponsive" });

            for(var k in js.menu)
            {
                console.log(k);
                console.log(js.menu[k].id);

                if(js.menu[k].id == undefined)
                    continue;

                var ul = $("<ul>", { class: "navbar-nav" });
                var li = $("<li>", { class: "nav-item" });
                var a = $("<a>", { class: "nav-link", href: "#" });
                var _i = $("<i>", { class: "icons " + js.menu[k].icon });
                
                a.append(_i);
                a.append($("<b>").append(" " + js.menu[k].id));
                li.append(a);
                
                if(js.menu[k].dropdown)
                {
                    li.addClass("dropdown");
                    a.addClass("dropdown-toggle");
                    a.attr("data-toggle","dropdown");
                    a.attr("aria-haspopup",true);
                    a.attr("aria-expanded",false);

                    var dropdown_menu = $("<div>", { class: "dropdown-menu" });

                    for(var d in js.menu[k].dropdown)
                    {
                        //console.log(js.menu[k].dropdown[d].id);
                        var dropdown_id = js.menu[k].dropdown[d].id;

                        var onclick = js.menu[k].dropdown[d].onClick;
                        if(onclick == undefined) {

                            var d = $("<div>", { class: "dropdown-divider" });
                            dropdown_menu.append(d);
                        }else{
                            
                            var dropdown_item = $("<a>", { class: "dropdown-item", href: "#" });

                            var icon = $("<i>", { class: "icons " + js.menu[k].dropdown[d].icon });
                            var item = $("<span>");

                            if (onclick.indexOf("/") != -1 && onclick.indexOf("alertify") == -1)
                            {
                                dropdown_item.attr("href", onclick);
                            }else{
                                dropdown_item.attr("onClick", onclick);
                            }

                            dropdown_item.append(icon);
                            dropdown_item.append(item.append(" " + dropdown_id));
                            dropdown_menu.append(dropdown_item);
                        }
                    }

                    li.append(dropdown_menu);
                }else{
                    a.attr("href", js.menu[k].onClick);
                }

                ul.append(li);
                div.append(ul);
            }
			wrap.append(div);

            var col = $("<div>", { class: "col-auto mr-auto mb-auto mt-auto", id: "opStatus" });
			wrap.append(col);

            var col = $("<div>", { class: "col-auto mb-auto mt-auto" });
            var theme_icon = $("<i>", { class: "icons icon-theme icon-day-and-night text-dark", "data-toggle": "tooltip", "data-html": "true" });
            theme_icon.click(function() {
                if(theme == ".slate") {
                    theme = "";
                }else{
                    theme = ".slate";
                }
                setCookie("theme", theme, 1);
                location.reload();
                //loadTheme();
                //setTheme();
            });
            col.append(theme_icon);
            wrap.append(col);

			nav.append(wrap);

            setTheme();

            $('[data-toggle="tooltip"]').tooltip();

            //Build the Menu before we get frozen with serial.php
            var path = window.location.pathname;
            var page = path.split("/").pop();
            if(page == "" || page == "index.php") {
                setTimeout(function () { //wait for icons to load
                    initializeSerial();
                }, 1000);
            }
        }
    });
};

function detectTheme()
{
    var t = getCookie("theme");
    if(t == undefined) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return ".slate";
        }else{
            return ""
        }
    }
    return t;
};

function switchTheme(element,dark,light) {
     if(theme == "") {
        var e = $(element + "." + dark);
        e.removeClass(dark);
        e.addClass(light);
    }else{
        var e = $(element + "." + light);
        e.removeClass(light);
        e.addClass(dark);
    }
};

function setTheme() {
    //loadTheme();
    if(theme == ".slate") {
        $(".icon-day-and-night").attr("data-original-title", "<h6 class='text-white'>Light Theme</h6>");
    }else{
        $(".icon-day-and-night").attr("data-original-title", "<h6 class='text-white'>Dark Theme</h6>");
    }
    switchTheme("i.icon-theme","text-white","text-dark");
    switchTheme("div","navbar-dark","navbar-light");
    switchTheme("div","bg-primary","bg-light");
    switchTheme("div","text-white","text-dark");
    switchTheme("table","bg-primary","bg-light");
};

function loadTheme() {
    if(theme == ".slate") {
        $('link[title="main"]').attr('href', "css/bootstrap.slate.css");
    }else{
        $('link[title="main"]').attr('href', "css/bootstrap.css");
    }
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        $("head link[rel='stylesheet']").last().after("<link rel='stylesheet' href='css/mobile.css' type='text/css'>");
    }
};

function deleteCookie(name, path, domain) {

  if(getCookie(name)) {
    document.cookie = name + "=" +
      ((path) ? ";path="+path:"")+
      ((domain)?";domain="+domain:"") +
      ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
  }
};

function setCookie(name, value, exdays) {

    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + (exdays == null ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = name + "=" + c_value;
};

function getCookie(name) {
    
    var i,
        x,
        y,
        ARRcookies = document.cookie.split(";");

    for (var i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == name) {
            return unescape(y);
        }
    }
};
