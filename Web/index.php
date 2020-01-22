<!DOCTYPE html>
<html>
    <head>
        <?php include "header.php" ?>
        <link rel="stylesheet" type="text/css" href="css/ion.rangeSlider.css" />
        <script src="js/ion.rangeSlider.js"></script>
        <script src="js/index.js"></script>
    </head>
    <body>
        <div class="navbar navbar-expand-lg fixed-top navbar-light bg-light" id="mainMenu"></div>
        <div class="row mt-5"></div>
        <div class="container">
            <div class="row" align="center">
                <div class="col">
                    <hr>
                    <i class="d-none icons icon-com display-2" id="com"></i>
                    <div class="container table-active table-bordered">
                        <div class="row p-2">
                            <div class="col">
                                <button type="button" class="btn btn-danger" onclick="stopCharger()"><i class="icons icon-alert"></i> Stop Charger</button>
                            </div>
                        </div>
                    </div>
                    <br/><br/>
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
                                <button type="button" class="btn btn-success" onclick="startCharger()"><i class="icons icon-power"></i> Start Charger</button>
                            </div>
                        </div>
                    </div>
                    <hr>
                </div>
            </div>
            <div class="row" align="center">
                <div class="col">
                    <hr>
                    <div class="d-none spinner-border text-dark" id="loader-parameters"></div>
                    <i class="d-none icons icon-com display-2" id="com"></i>
                    <hr>
                </div>
            </div>
            <div class="row" align="center">
                <div class="col">
                    <table class="table table-active table-bordered bg-light table-striped table-hover" id="parameters"></table>
                </div>
            </div>
        </div>
    </body>
</html>