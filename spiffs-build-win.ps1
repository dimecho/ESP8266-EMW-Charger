#==============
#Copy Files
#==============
Remove-Item -Recurse -Force .\data -ErrorAction SilentlyContinue
Copy-Item -Path .\Web -Recurse -Destination .\data -Container
Remove-Item .\data\img\screenshot.png

#======================
#Correct long filenames
#======================
Get-ChildItem .\data -Recurse -Filter *.* | 
Foreach-Object {
	if (-Not (Test-Path $_.FullName -PathType Container)) {
		if($_.Name.length -gt 12){
			$i = "";
			Do {
				$longName = $_.Name
				$shortName = "$($_.BaseName.Substring(0,8))$($i)$($_.Extension)"
				$shortPath = "$(Split-Path -Path $_.FullName)\$($shortName)"
				Write-Host $shortPath
				$i = [int]$i+1
			} while(Test-Path $shortPath)

			Move-Item $_.FullName -Destination $shortPath

			Get-ChildItem .\data -Recurse -Include *.php,*.css,*.js,*.json | 
			Foreach-Object {
				if (-Not (Test-Path $_.FullName -PathType Container)) {
                    try {
					   (Get-Content $_.FullName).Replace($longName, $shortName) | Set-Content $_.FullName
                    }catch { }
				}
			}
		}
	}
}

#==============
#Compress Files
#==============
Get-ChildItem .\data -Recurse -Filter *.* | 
Foreach-Object {
    if (-Not (Test-Path $_.FullName -PathType Container)) {
        Start-Process .\tools\gzip.exe -ArgumentList $_.FullName -NoNewWindow -Wait
        Move-Item "$($_.FullName).gz" -Destination $_.FullName
    }
}

#================
#Find Folder Size
#================
Start-Process .\tools\mkspiffs.exe -ArgumentList "-c .\data -b 8192 -p 256 -s 450000 flash-spiffs.bin" -NoNewWindow -PassThru -Wait