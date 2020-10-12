#include <FS.h>
#include <EEPROM.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPUpdateServer.h>
#include "version.h"

#ifdef ARDUINO_MOD_WIFI_ESP8266
#define LED_BUILTIN 1 //GPIO1=Olimex
#else
#define LED_BUILTIN 2 //GPIO2=ESP-12/WeMos(D4)
#endif

#define DEBUG       false
#define EEPROM_ID   0x3BDAB201 //Identify Sketch by EEPROM

ESP8266WebServer server(80);
ESP8266HTTPUpdateServer updater;

int WIFI_PHY_MODE = 1; //WIFI_PHY_MODE_11B = 1, WIFI_PHY_MODE_11G = 2, WIFI_PHY_MODE_11N = 3
double WIFI_PHY_POWER = 20.5; //Max = 20.5dbm
int ACCESS_POINT_MODE = 0;
char ACCESS_POINT_SSID[] = "Charger";
char ACCESS_POINT_PASSWORD[] = "";
int ACCESS_POINT_CHANNEL = 1;
int ACCESS_POINT_HIDE = 0;
int DATA_LOG = 0; //Enable data logger
int LOG_INTERVAL = 5; //seconds between data collection and write to SPIFFS
int TIMER_VOLTAGE = 0; //Stop Charger Voltage
int TIMER_CURRENT = 0; //Limit Charger Current
int TIMER_CRC = 0; //CRC for Voltage and Current
int TIMER_DELAY = 0; //Delay Start Timer (minutes)
int PLUG_DELAY = 0; //Plugin Auto Timer (minutes)

uint32_t syncTime = 0;
uint32_t startTime = 0;
uint32_t plugTime = 0;

const char text_html[] = "text/html";
const char text_plain[] = "text/plain";
const char text_json[] = "application/json";

void setup()
{
  Serial.begin(19200, SERIAL_8N1);
  Serial.setTimeout(1000);

  SPIFFS.begin();

  //======================
  //NVRAM type of Settings
  //======================
  EEPROM.begin(1024);
  long e = NVRAM_Read(0).toInt();
#if DEBUG
  Serial.setDebugOutput(true);
  Serial.println(e, HEX);
#endif
  if (e != EEPROM_ID) {
    //Check for multiple Inverter SSIDs
    uint8_t n = WiFi.scanNetworks();
    if (n != 0) {
      for (uint8_t i = 0; i < n; ++i) {
        Serial.println(WiFi.SSID(i));
        if (WiFi.SSID(i) == ACCESS_POINT_SSID) {
          strcat(ACCESS_POINT_SSID, String("-" + i).c_str()); //avoid conflict
          break;
        }
      }
    }
    NVRAM_Erase();
    NVRAM_Write(0, String(EEPROM_ID));
    NVRAM_Write(1, String(ACCESS_POINT_MODE));
    NVRAM_Write(2, String(ACCESS_POINT_HIDE));
    NVRAM_Write(3, String(WIFI_PHY_MODE));
    NVRAM_Write(4, String(WIFI_PHY_POWER));
    NVRAM_Write(5, String(ACCESS_POINT_CHANNEL));
    NVRAM_Write(6, ACCESS_POINT_SSID);
    NVRAM_Write(7, ACCESS_POINT_PASSWORD);
    NVRAM_Write(8, String(DATA_LOG));
    NVRAM_Write(9, String(LOG_INTERVAL));
    NVRAM_Write(10, String(TIMER_VOLTAGE));
    NVRAM_Write(11, String(TIMER_CURRENT));
    NVRAM_Write(12, String(TIMER_CRC));
    NVRAM_Write(13, String(TIMER_DELAY));
    NVRAM_Write(14, String(PLUG_DELAY));

    SPIFFS.format();
  } else {
    ACCESS_POINT_MODE = NVRAM_Read(1).toInt();
    ACCESS_POINT_HIDE = NVRAM_Read(2).toInt();
    WIFI_PHY_MODE = NVRAM_Read(3).toInt();
    WIFI_PHY_POWER = NVRAM_Read(4).toDouble();
    ACCESS_POINT_CHANNEL = NVRAM_Read(5).toInt();
    String s = NVRAM_Read(6);
    s.toCharArray(ACCESS_POINT_SSID, s.length() + 1);
    String p = NVRAM_Read(7);
    p.toCharArray(ACCESS_POINT_PASSWORD, p.length() + 1);
    DATA_LOG = NVRAM_Read(8).toInt();
    LOG_INTERVAL = NVRAM_Read(9).toInt();
    TIMER_VOLTAGE = NVRAM_Read(10).toInt();
    TIMER_CURRENT = NVRAM_Read(11).toInt();
    TIMER_CRC = NVRAM_Read(12).toInt();
    TIMER_DELAY = NVRAM_Read(13).toInt();
    PLUG_DELAY = NVRAM_Read(14).toInt();
  }
  //EEPROM.end();

  WiFi.setPhyMode((WiFiPhyMode_t)WIFI_PHY_MODE);
  WiFi.setOutputPower(WIFI_PHY_POWER);

  if (ACCESS_POINT_MODE == 0) {
    //=====================
    //WiFi Access Point Mode
    //=====================
    WiFi.mode(WIFI_AP);
    IPAddress ip(192, 168, 4, 1);
    IPAddress gateway(192, 168, 4, 1);
    IPAddress subnet(255, 255, 255, 0);
    WiFi.softAPConfig(ip, gateway, subnet);
    WiFi.softAP(ACCESS_POINT_SSID, ACCESS_POINT_PASSWORD, ACCESS_POINT_CHANNEL, ACCESS_POINT_HIDE);
    //Serial.println(WiFi.softAPIP());
  } else {
    //================
    //WiFi Client Mode
    //================
    WiFi.mode(WIFI_STA);
    WiFi.begin(ACCESS_POINT_SSID, ACCESS_POINT_PASSWORD);  //Connect to the WiFi network

    WiFi.setAutoConnect(false);
    WiFi.setAutoReconnect(false);
    //WiFi.enableAP(0);
    while (WiFi.waitForConnectResult() != WL_CONNECTED) {
      //Serial.println("Connection Failed! Rebooting...");
      delay(5000);
      ESP.restart();
    }
    //Serial.println(WiFi.localIP());
  }

  LOG_INTERVAL =  LOG_INTERVAL * 1000; //convert seconds to miliseconds
  TIMER_DELAY = TIMER_DELAY * 60 * 1000;
  PLUG_DELAY = PLUG_DELAY * 60 * 1000;

  //===============
  //Web OTA Updater
  //===============
  //updater.setup(&server, "/firmware", update_username, update_password);
  updater.setup(&server);

  //===============
  //Web Server
  //===============
  server.on("/format", HTTP_GET, []() {
    String result = SPIFFS.format() ? "OK" : "Error";
    FSInfo fs_info;
    SPIFFS.info(fs_info);
    server.send(200, text_plain, "<b>Format " + result + "</b><br/>Total Flash Size: " + String(ESP.getFlashChipSize()) + "<br>SPIFFS Size: " + String(fs_info.totalBytes) + "<br>SPIFFS Used: " + String(fs_info.usedBytes));
  });
  server.on("/reset", HTTP_GET, []() {
    server.send(200, text_plain, "...");
    delay(500);
    ESP.restart();
  });
  server.on("/start", HTTP_GET, []() {
    if (server.hasArg("timer")) {
      int i = server.arg("timer").toInt();
      if (i > 0) {
        TIMER_DELAY = i * 60 * 1000;
        startTime = millis();
      }
    }
    server.send(200, text_plain, String(TIMER_DELAY));
  });
  server.on("/stop", HTTP_GET, []() {
    startTime = 0;
    server.send(200, text_plain, String(TIMER_DELAY));
  });
  server.on("/nvram", HTTP_GET, []() {
    if (server.hasArg("offset")) {
      int i = server.arg("offset").toInt();
      String v = server.arg("value");
      NVRAM_Write(i, v);
      server.send(200, text_plain, v);
    } else {
      String out = NVRAM(1, 14, 7);
      server.send(200, text_json, out);
    }
  });
  server.on("/nvram", HTTP_POST, []() {
    NVRAMUpload();
  });
  server.on("/serial.php", HTTP_GET, []() {
    if (server.hasArg("init"))
    {
      Serial.end();
      Serial.begin(server.arg("init").toInt(), SERIAL_8N1);

      server.send(200, text_plain, "OK");
    }
    else if (server.hasArg("get"))
    {
      String out = flushSerial();
      server.send(200, text_plain, out);
    }
    else if (server.hasArg("command"))
    {
      String out = readSerial(server.arg("command"));
      SPIFFS.remove("/data.txt");
      server.send(200, text_plain, out);
    }
  });
  server.on("/", []() {
    if (SPIFFS.exists("/index.html")) {
      server.sendHeader("Location", "/index.html");
      server.send(303);
    } else {
      server.sendHeader("Refresh", "6; url=/update");
      server.send(200, text_html, "File System Not Found ...Upload SPIFFS");
    }
  });
  server.onNotFound([]() {
    if (!HTTPServer(server.uri()))
      server.send(404, text_plain, "404: Not Found");
  });
  server.begin();

  pinMode(LED_BUILTIN, OUTPUT);
}

void loop()
{
  server.handleClient();

  if ((millis() - syncTime) < LOG_INTERVAL) return;
  syncTime = millis();
  
  if (startTime > 0 && (millis() - startTime) > TIMER_DELAY) { //Manual Start Timer
    chargerStart();
    startTime = 0; //start only once
  } else if (plugTime > 0 && (millis() - plugTime) > PLUG_DELAY) { //Plug-in Start Timer
    chargerStart();
    plugTime = 0; //start only once
  }
  
  String output = flushSerial();

  //if (output.indexOf("R") != -1) {
    if (PLUG_DELAY > 0) {
      plugTime = millis();
    }
  //}

  if (output.indexOf("D") != -1) { //Capture reports only
    if (DATA_LOG > 0) {
      FSInfo fs_info;
      SPIFFS.info(fs_info);

      if (fs_info.usedBytes < fs_info.totalBytes)
      {
        File file = SPIFFS.open("/data.txt", "a");
        file.print(output);
        file.close();
      }
    }
  }
}

void chargerStart()
{
  Serial.print("M,");
  Serial.print(TIMER_CURRENT);
  Serial.print(",");
  Serial.print(TIMER_VOLTAGE);
  Serial.print(",");
  Serial.print(TIMER_CRC);
  Serial.print(",E");
  Serial.print("\n");
}

//=============
// NVRAM CONFIG
//=============
String NVRAM(uint8_t from, uint8_t to, uint8_t skip)
{
  String out = "{\n";

  out += "\t\"nvram\": [\"";
  out += _VERSION;
  out += "\",";

  for (uint8_t i = from; i <= to; i++) {
    if (skip == -1 || i != skip) {
      out += "\"" + NVRAM_Read(i) + "\",";
    }
  }

  out = out.substring(0, (out.length() - 1));
  out += "]\n}";

  return out;
}

void NVRAMUpload()
{
  NVRAM_Erase();

  String out = "<pre>";

  for (uint8_t i = 0; i <= 6; i++) {
    out += server.argName(i) + ": ";
    NVRAM_Write(i, server.arg(i));
    out += NVRAM_Read(i) + "\n";
  }

  //skip confirm password (7)

  for (uint8_t i = 8; i <= 9; i++) {
    out += server.argName(i) + ": ";
    NVRAM_Write(i - 1, server.arg(i));
    out += NVRAM_Read(i - 1) + "\n";
  }
  out += "\n...Rebooting";
  out += "</pre>";

  server.sendHeader("Refresh", "8; url=/esp8266.html");
  server.send(200, text_html, out);

  SPIFFS.remove("/data.txt");

  WiFi.disconnect(true);  //Erases SSID/password
  //ESP.eraseConfig();

  delay(4000);
  ESP.restart();
}

void NVRAM_Erase()
{
  for (uint16_t i = 0 ; i < EEPROM.length() ; i++) {
    EEPROM.write(i, 255);
  }
}

void NVRAM_Write(uint32_t address, String txt)
{
  char arrayToStore[32];
  memset(arrayToStore, 0, sizeof(arrayToStore));
  txt.toCharArray(arrayToStore, sizeof(arrayToStore)); // Convert string to array.

  EEPROM.put(address * sizeof(arrayToStore), arrayToStore);
  EEPROM.commit();
}

String NVRAM_Read(uint32_t address)
{
  char arrayToStore[32];
  EEPROM.get(address * sizeof(arrayToStore), arrayToStore);

  return String(arrayToStore);
}

bool HTTPServer(String file)
{
  if (SPIFFS.exists(file))
  {
    File f = SPIFFS.open(file, "r");
    if (f)
    {
      digitalWrite(LED_BUILTIN, HIGH);

      String contentType = getContentType(file);

      if (file.indexOf("data.txt") > 0) {
        server.sendHeader("Cache-Control", "no-store");
        server.streamFile(f, contentType);
      } else {
        server.sendHeader("Cache-Control", "max-age=3600");
        server.sendHeader("Content-Encoding", "gzip");
        server.streamFile(f, contentType);
      }
      f.close();

      digitalWrite(LED_BUILTIN, LOW);

      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

String getContentType(String filename)
{
  if (server.hasArg("download")) return "application/octet-stream";
  else if (filename.endsWith(".html")) return text_html;
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".json")) return text_json;
  else if (filename.endsWith(".png")) return "image/png";
  else if (filename.endsWith(".jpg")) return "image/jpeg";
  else if (filename.endsWith(".ttf")) return "font/ttf";
  else if (filename.endsWith(".woff")) return "font/woff";
  else if (filename.endsWith(".woff2")) return "font/woff2";
  return text_plain;
}

//===================
// SERIAL PROCESSING
//===================
String flushSerial()
{
  String output;

  //DEBUG
  //output = "M,R:M222,V061,c020,v246,E\n";
  //output = "M,D000,C096,V334,T038,O001,Ssss,E\n";
  //output = "M,D000,C096,V334,T038,O001,Ssss,E\nM,D000,C096,V334,T038,O001,Ssss,E\n";

  if (Serial.available()) {
    Serial.readStringUntil('M');
    output = "M" + Serial.readStringUntil('\n');
  }
  return output;
}

String readSerial(String cmd)
{
  Serial.print(cmd);
  Serial.print("\n");

  return cmd;

  //String output = Serial.readStringUntil('\n');
  //return output
}
