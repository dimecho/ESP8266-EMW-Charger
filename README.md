<p align="center"><img src="Web/img/charger.png?raw=true"></p>

# EMW Charger - ESP8266 Web Interface

A simple web interface with UART control based on [Remote Control Protocols for EMotorWerks](https://leafdriveblog.files.wordpress.com/2020/01/emotorwerks-chargers-serial-protocol.pdf)

## Screenshot

![Screenshot](Web/img/screenshot.png?raw=true)

## Download

[Download for ESP8266](../../releases/download/1.0/ESP8266-EMW-Charger.zip)

## Connect

    SSID: Charger
    Password: (blank)
    Interface: http://192.168.4.1

## Install

    1) Connect to ESP8266 USB-Serial-TTL
    2) Run sketch.ps1 flash "flash-sketch.bin"
    3) Run spiffs.ps1 flash "flash-spiffs.bin"

## Update

    1) Connect to ESP8266 WiFi
    2) Go to http://192.168.4.1/update

## Build

    [Arduino IDE Setup]

    1) Arduino/File -> Preferences -> Additional Boards Manager URLs: http://arduino.esp8266.com/stable/package_esp8266com_index.json
    2) Tools -> Boards -> Board Manager -> esp8266 -> Install
    3) Tools -> Boards -> WeMos D1 R1 -> Flash Size -> 4M (3M SPIFFS)

    [Build]

    1) Run spiffs-build-osx.sh (spiffs-build-win.ps1 Windows) build SPIFFS filesystem
    2) Open ESP8266-EMW-Charger.ino with Arduino IDE
    3) Sketch -> Export compiled Binary

## Author

Dima Dykhman

## License

[![CC0](https://licensebuttons.net/l/zero/1.0/88x31.png)](https://creativecommons.org/publicdomain/zero/1.0/)