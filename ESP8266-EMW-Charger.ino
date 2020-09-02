#include <FS.h>
#include <EEPROM.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPUpdateServer.h>

#ifdef ARDUINO_MOD_WIFI_ESP8266
#define LED_BUILTIN 1 //GPIO1=Olimex
#else
#define LED_BUILTIN 2 //GPIO2=ESP-12/WeMos(D4)
#endif

#define VERSION 1.01

ESP8266WebServer server(80);
ESP8266HTTPUpdateServer updater;

int WIFI_PHY_MODE = 1; //WIFI_PHY_MODE_11B = 1, WIFI_PHY_MODE_11G = 2, WIFI_PHY_MODE_11N = 3
float WIFI_PHY_POWER = 20.5; //Max = 20.5dbm
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
int TIMER_DELAY = 0; //Automatic Timer (minutes)

uint32_t syncTime = 0;
uint32_t startTime = 0;
bool phpTag[] = { false, false, false };
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
  
  int e = EEPROM.read(0);
  if (e != 48 && e != 49) {
    NVRAM_Erase();
    NVRAM_Write(0, String(ACCESS_POINT_MODE));
    NVRAM_Write(1, String(ACCESS_POINT_HIDE));
    NVRAM_Write(2, String(WIFI_PHY_MODE));
    NVRAM_Write(3, String(WIFI_PHY_POWER));
    NVRAM_Write(4, String(ACCESS_POINT_CHANNEL));
    NVRAM_Write(5, ACCESS_POINT_SSID);
    NVRAM_Write(6, ACCESS_POINT_PASSWORD);
    NVRAM_Write(7, String(DATA_LOG));
    NVRAM_Write(8, String(LOG_INTERVAL));
    NVRAM_Write(9, String(TIMER_VOLTAGE));
    NVRAM_Write(10, String(TIMER_CURRENT));
    NVRAM_Write(11, String(TIMER_CRC));
    NVRAM_Write(12, String(TIMER_DELAY));
    SPIFFS.format();
  } else {
    ACCESS_POINT_MODE = NVRAM_Read(0).toInt();
    ACCESS_POINT_HIDE = NVRAM_Read(1).toInt();
    WIFI_PHY_MODE = NVRAM_Read(2).toInt();
    WIFI_PHY_POWER = NVRAM_Read(3).toFloat();
    ACCESS_POINT_CHANNEL = NVRAM_Read(4).toInt();
    String s = NVRAM_Read(5);
    s.toCharArray(ACCESS_POINT_SSID, s.length() + 1);
    String p = NVRAM_Read(6);
    p.toCharArray(ACCESS_POINT_PASSWORD, p.length() + 1);
    DATA_LOG = NVRAM_Read(7).toInt();
    LOG_INTERVAL = NVRAM_Read(8).toInt();
    TIMER_VOLTAGE = NVRAM_Read(9).toInt();
    TIMER_CURRENT = NVRAM_Read(10).toInt();
    TIMER_CRC = NVRAM_Read(11).toInt();
    TIMER_DELAY = NVRAM_Read(12).toInt();
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
    startTime = millis();
    server.send(200, text_plain, String(TIMER_DELAY));
  });
  server.on("/stop", HTTP_GET, []() {
    startTime = 0;
    server.send(200, text_plain, String(TIMER_DELAY));
  });
  server.on("/nvram", HTTP_GET, []() {
    if (server.hasArg("offset")){
        int i = server.arg("offset").toInt();
        String v = server.arg("value");
        NVRAM_Write(i, v);
        server.send(200, text_plain, v);
    }else{
      String out = NVRAM(0, 12, 6);
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
    if (SPIFFS.exists("/index.php")) {
      server.sendHeader("Location", "/index.php");
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

  if (startTime > 0 && (millis() - startTime) > TIMER_DELAY)
  {
    Serial.print("M,");
    Serial.print(TIMER_CURRENT);
    Serial.print(",");
    Serial.print(TIMER_VOLTAGE);
    Serial.print(",");
    Serial.print(TIMER_CRC);
    Serial.print(",E");
    Serial.print("\n");
    startTime = 0; //start only once
  }

  if (DATA_LOG == 0 || (millis() - syncTime) < LOG_INTERVAL) return;
  syncTime = millis();

  String output = flushSerial();

  if (output.indexOf("D") != -1) { //Capture reports only
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

//=============
// NVRAM CONFIG
//=============
String NVRAM(uint8_t from, uint8_t to, uint8_t skip)
{
  String out = "{\n";

  out += "\t\"nvram\": [\"";
  out += VERSION;
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

  server.sendHeader("Refresh", "8; url=/esp8266.php");
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

//=============
// PHP MINI
//=============
String PHP(String line, int i)
{
  if (line.indexOf("<?php") != -1) {
    line.replace("<?php", "");
    phpTag[i] = true;
  } else if (line.indexOf("?>") != -1) {
    line = "";
    phpTag[i] = false;
  }

  if (phpTag[i] == true)
  {
    if (line.indexOf("include") != -1 ) {
      //line.trim();
      line.replace("'", "\"");
      line.replace("(", "");
      line.replace(")", "");
      line.replace(";", "");
      int s = line.indexOf("\"") + 1;
      int e = line.lastIndexOf("\"");
      String include = line.substring(s, e);

      File f = SPIFFS.open("/" + include, "r");
      if (f)
      {
        String l;
        int x = i + 1;
        phpTag[x] = false;

        while (f.available()) {
          l = f.readStringUntil('\n');
          line += PHP(l, x);
          //line += "\n";
        }
        f.close();
      }

      line.replace("include_once", "");
      line.replace("include", "");
      line.replace("\"" + include + "\"", "");
      if (line.indexOf("?>") != -1) {
        line.replace("?>", "");
        phpTag[i] = false;
      }

    } else {
      line = "";
    }
  }

  return line;
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

      if (file.indexOf(".php") > 0) {

        String response = "";
        String l = "";
        phpTag[0] = false;

        while (f.available()) {
          l = f.readStringUntil('\n');
          response += PHP(l, 0);
          //response += "\n";
        }
        server.send(200, contentType, response);
      } else if (file.indexOf("data.txt") > 0) {
        server.streamFile(f, contentType);
      } else {
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
  else if (filename.endsWith(".php")) return text_html;
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
