<!DOCTYPE html>
<html>
    <head>
        <script>
        	function handleEvent(e) {
			    console.log(e);
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/format");
                xhr.send();
                alert("File System not compressed! Please flash SPIFFS binary.");
                window.location.href = "/update";
			}
			function addListeners(xhr) {
			    xhr.addEventListener('error', handleEvent);
			}
            var xhr = new XMLHttpRequest();
            addListeners(xhr);
            xhr.open("GET", "js/menu.js");
            xhr.send();
        </script>
        <?php include "header.php" ?>
        <link rel="stylesheet" type="text/css" href="css/rangeslider.css" />
        <link rel="stylesheet" type="text/css" href="css/roundslider.css" />
        <script src="js/rangeslider.js"></script>
        <script src="js/roundslider.js"></script>
        <script src="js/index.js"></script>
    </head>
    <body>
        <div class="navbar navbar-expand-lg fixed-top navbar-light bg-light" id="mainMenu"></div>
        <div class="row mt-5"></div>
        <div class="container">
            <div class="row" align="center">
                <div class="col">
                    <hr>
                    <div class="container table-active table-bordered">
                        <div class="row p-2">
                            <div class="col">
                                <button type="button" class="btn btn-danger" onclick="stopCharger()"><i class="icons icon-alert"></i> Stop Charger</button>
                            </div>
                            <div class="col">
                                <button type="button" class="btn btn-success" onclick="startCharger()"><i class="icons icon-power"></i> Start Charger</button>
                            </div>
                        </div>
                    </div>
                    <br/><br/>
                    <i class="d-none icons icon-com display-2 p-4" id="com"></i>
                    <div class="d-none container table-active table-bordered" id="chargerStatus">
                        <div class="row p-2">
                            <div class="col text-dark" id="chargerValues">
                                <div class="d-none spinner-border text-dark" id="loadValues"></div>
                            </div>
                        </div>
                        <div class="row p-2">
                            <div class="col">
                                <input id="refreshSpeed" type="text" data-provide="slider" />
                            </div>
                        </div>
                    </div>
                    <br/><br/>
                    <div class="container table-active table-bordered">
                        <div class="row p-2">
                            <div class="col">
                                <div class="form-group">
                                    <div class="input-group">
                                        <div class="input-group-addon"><i class="icons icon-settings p-3"></i></div>
                                        <input type="text" id="voltage" name="voltage" class="form-control" placeholder="Voltage Setting" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="input-group">
                                        <div class="input-group-addon"><i class="icons icon-settings p-3"></i></div>
                                        <input type="text" id="current" name="current" class="form-control" placeholder="Current Setting" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="input-group">
                                        <div class="input-group-addon"><i class="icons icon-settings p-3"></i></div>
                                        <input type="text" id="crc" name="crc" class="form-control" placeholder="Checksum" required>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row p-2">
                            <div class="col">
                                <button type="button" class="btn btn-primary" onclick="timerCharger()"><i class="icons icon-speedometer"></i> Start Timer</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <br/><br/>
        <div class="modal" id="chargerTimerModal">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Start Timer</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <br/>
                        <div class="mx-auto" id="timer-Slider"></div>
                        <br/>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>