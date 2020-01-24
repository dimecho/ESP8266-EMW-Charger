<!DOCTYPE html>
<html>
    <head>
        <?php include "header.php" ?>
        <script src="js/chart.js"></script>
        <script src="js/graph.js"></script>
    </head>
    <body>
        <div class="navbar navbar-expand-lg fixed-top navbar-light bg-light" id="mainMenu"></div>
        <div class="row mt-5"></div>
        <div class="row mt-5"></div>
		<div class="container table-active table-bordered">
            <div class="row p-2" align="center">
                <div class="col">
                    <button type="button" class="btn btn-primary" onclick="exportPNG()"><i class="icons icon-png"></i> Export PNG</button>
                </div>
                <div class="col">
                    <button type="button" class="btn btn-primary" onclick="exportRAW()"><i class="icons icon-source"></i> Export RAW</button>
                </div>
                <div class="col">
                    <button type="button" class="btn btn-success" onclick="exportCSV()"><i class="icons icon-csv"></i> Export CSV</button>
                </div>
            </div>
        </div>
        <br/><br/>
        <div class="container bg-light">
            <div class="row">
                <div class="col">
					<div class="chartWrapper bg-light">
						<div class="chartAreaWrapper">
							<div class="chartAreaWrapper2">
								<canvas id="chartCanvas"></canvas>
							</div>
						</div>
						<canvas id="chartAxis" width="0"></canvas>
					</div>
                </div>
            </div>
            <div class="row mt-4"></div>
        </div>
        <br/><br/>
    </body>
</html>