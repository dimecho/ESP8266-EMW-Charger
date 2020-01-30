<!DOCTYPE html>
<html>
 <head>
	<?php include "header.php" ?>
	<script src="js/esp8266.js"></script>
 </head>
 <body>
   	<div class="navbar navbar-expand-lg fixed-top navbar-light bg-light" id="mainMenu"></div>
    <div class="row mt-5"></div>
    <div class="row mt-5"></div>
	<div class="container">
		<div class="row">
			<div class="col">
			    <table class="table table-active table-bordered">
                    <tr>
                        <td>
                        	<center><div class="spinner-border text-dark"></div></center>
                        	<form method="POST" action="/nvram" id="parameters" oninput="formValidate()">
                        		<fieldset class="form-group">
                        			<legend>ESP8266 Wireless Connection:</legend>
		                        	<div class="form-check">
		                        		<label class="form-check-label">
									    <input type="radio" class="form-check-input" id="WiFiModeAP" name="WiFiMode" value="0">
									        WiFi Access Point
									    </label>
									</div>
									<div class="form-check">
		                        		<label class="form-check-label">
									    <input type="radio" class="form-check-input" id="WiFiModeClient" name="WiFiMode" value="1">
									        WiFi Client
									    </label>
									</div>
									<br>
									<div class="form-check">
									  <label class="form-check-label">
									  	<input type="hidden" id="WiFiHidden" name="WiFiHidden" value="0">
									    <input type="checkbox" id="WiFiHiddenCheckbox" class="form-check-input" onclick="HiddenCheck('WiFiHidden',this)">
									    	Hidden SSID
									  </label>
									</div>
								</fieldset>
								<div class="form-group">
									<label for="WiFiPhyMode">Physical</label>
									<div class="input-group">
										<div class="input-group-addon"><i class="icons icon-wifi p-3"></i></div>
										<select id="WiFiPhyMode" class="form-control" name="WiFiPhyMode">
											<option value="1">802.11 b</option>
											<option value="2">802.11 g</option>
											<option value="3">802.11 n</option>
										</select>
									</div>
								</div>
								<div class="form-group">
									<div class="input-group">
										<div class="input-group-addon"><i class="icons icon-power p-3"></i></div>
										<select id="WiFiPower" class="form-control" name="WiFiPower">
											<option value="1">1 dbm</option>
											<option value="2">2 dbm</option>
											<option value="3">3 dbm</option>
											<option value="5">5 dbm</option>
											<option value="10">10 dbm</option>
											<option value="20.5">20.5 dbm</option>
										</select>
									</div>
								</div>
								<div class="form-group">
									<label for="WiFiChannel">Channel</label>
									<div class="input-group">
										<div class="input-group-addon"><i class="icons icon-graph-bar p-3"></i></div>
										<select id="WiFiChannel" class="form-control" name="WiFiChannel">
											<option>1</option>
											<option>2</option>
											<option>3</option>
											<option>4</option>
											<option>5</option>
											<option>6</option>
											<option>7</option>
											<option>8</option>
											<option>9</option>
											<option>10</option>
											<option>11</option>
										</select>
									</div>
								</div> 
								<div class="form-group">
									<div class="input-group">
								    	<div class="input-group-addon"><i class="icons icon-wifi p-3"></i></div>
								    	<input type="text" id="WiFiSSID" name="WiFiSSID" class="form-control" placeholder="SSID" required>
									</div>
								</div>
								<div class="form-group">
									<div class="input-group">
										<div class="input-group-addon"><i class="icons icon-password p-3"></i></div>
								    	<input type="password" id="WiFiPassword" name="WiFiPassword" class="form-control" aria-describedby="passwordHelpBlock" placeholder="Password" required>
									</div>
									<small id="passwordHelpBlock" class="form-text text-muted pr-5">
										WPA2 password must be 8-20 characters long.
									</small>
								</div>
								<div class="form-group">
									<div class="input-group">
										<div class="input-group-addon"><i class="icons icon-password p-3"></i></div>
								    	<input type="password" id="WiFiPasswordConfirm" name="WiFiPasswordConfirm" class="form-control" placeholder="Password Confirm">
									</div>
								</div>
								<fieldset class="form-group">
									<label for="EnableLOGCheckbox">Data Logger</label>
									<div class="form-check">
									  <label class="form-check-label">
										  	<input type="hidden" id="EnableLOG" name="EnableLOG" value="0">
									    	<input type="checkbox" id="EnableLOGCheckbox" class="form-check-input" onclick="HiddenCheck('EnableLOG',this)"> Enable Data Collection
									  </label>
									</div>
									<div class="input-group">
										<div class="input-group-addon"><i class="icons icon-puzzle p-3"></i></div>
								    	<input type="text" id="EnableLOGInterval" name="EnableLOGInterval" class="form-control" placeholder="Log Interval (seconds)">
									</div>
								</fieldset>
								<center><button type="submit" class="btn btn-success"><i class="icons icon-ok"></i> Save</button></center>
                            </form>
                        </td>
                    </tr>
                </table>
				<table class="table table-active table-bordered d-none" id="esp8266-flash-select">
					<tr align="center">
						<td align="center">
							<button class="btn btn-primary" type="button" id="browseSPIFFS"><i class="icons icon-chip"></i> Flash SPIFFS</button>
						</td>
						<td align="center">
							<button class="btn btn-primary" type="button" id="browseSketch"><i class="icons icon-chip"></i> Flash Sketch</button>
						</td>
					</tr>
					<tr align="center">
						<td colspan="2">
							<div class="progress progress-striped active">
								<div class="progress-bar" style="width:1%"></div>
							</div>
						</td>
					</tr>
				</table>
			</div>
		</div>
	</div>
	<form method="POST" action="/update" enctype="multipart/form-data" id="formSketch">
		<input type="file" accept=".bin" name="firmware" id="fileSketch" hidden />
		<input type="submit" hidden />
	</form>
	<form method="POST" action="/update" enctype="multipart/form-data" id="formSPIFFS">
		<input type="file" accept=".bin" name="filesystem" id="fileSPIFFS" hidden />
		<input type="submit" hidden />
	</form>
</body>
</html>