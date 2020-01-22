#include <RemoteDebug.h>
#include <FS.h>
#include <EEPROM.h>
#include <ESP8266WiFi.h>
//#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <ESP8266WebServer.h>
#include "src/ESP8266HTTPUpdateServer.h"
#define SPIFFS_ALIGNED_OBJECT_INDEX_TABLES 1
#define LED_BUILTIN 2 //GPIO1=Olimex, GPIO2=ESP-12/WeMos(D4)

RemoteDebug Debug;
ESP8266WebServer server(80);
ESP8266HTTPUpdateServer updater;
File fsUpload;

int ACCESS_POINT_MODE = 0;
char ACCESS_POINT_SSID[] = "EMW Charger";
char ACCESS_POINT_PASSWORD[] = "emwcharger123";
int ACCESS_POINT_CHANNEL = 1;
int ACCESS_POINT_HIDE = 0;
bool phpTag[] = { false, false, false };
const char text_html[] = "text/html";
const char text_plain[] = "text/plain";
const char text_json[] = "application/json";

void setup()
{
  Serial.begin(19200, SERIAL_8N1);
  //Serial.begin(115200, SERIAL_8N1);

  //Serial.setTimeout(1000);
  //Serial.setDebugOutput(true);

  uint8_t timeout = 10;
  while (!Serial && timeout > 0) {
    Serial.swap(); //Swapped UART pins
    delay(500);
    timeout--;
  }

  //===========
  //File system
  //===========
  SPIFFS.begin();

  //======================
  //NVRAM type of Settings
  //======================
  EEPROM.begin(256);
  /*
    New ESP can cause "Fatal exception 9(LoadStoreAlignmentCause)" with uninitialized EEPROM
    TODO: Find the solution - ESP.getResetReason()?
  */
  Serial.println(ESP.getResetReason());
  if (NVRAM_Read(0) == "") {
    NVRAM_Erase();
    NVRAM_Write(0, String(ACCESS_POINT_MODE));
    NVRAM_Write(1, String(ACCESS_POINT_HIDE));
    NVRAM_Write(2, String(ACCESS_POINT_CHANNEL));
    NVRAM_Write(3, ACCESS_POINT_SSID);
    NVRAM_Write(4, ACCESS_POINT_PASSWORD);
    SPIFFS.format();
  } else {
    ACCESS_POINT_MODE = NVRAM_Read(0).toInt();
    ACCESS_POINT_HIDE = NVRAM_Read(1).toInt();
    ACCESS_POINT_CHANNEL = NVRAM_Read(2).toInt();
    String s = NVRAM_Read(3);
    s.toCharArray(ACCESS_POINT_SSID, s.length() + 1);
    String p = NVRAM_Read(4);
    p.toCharArray(ACCESS_POINT_PASSWORD, p.length() + 1);
  }
  //EEPROM.end();

  if (ACCESS_POINT_MODE == 0) {
    //=====================
    //WiFi Access Point Mode
    //=====================
    WiFi.mode(WIFI_AP);
    IPAddress ip(192, 168, 4, 2);
    IPAddress gateway(192, 168, 4, 2);
    IPAddress subnet(255, 255, 255, 0);
    IPAddress dns0(192, 168, 4, 2);
    WiFi.softAPConfig(ip, gateway, subnet);
    WiFi.softAP(ACCESS_POINT_SSID, ACCESS_POINT_PASSWORD, ACCESS_POINT_CHANNEL, ACCESS_POINT_HIDE);
    //Serial.println(WiFi.softAPIP());
  } else {
    //================
    //WiFi Client Mode
    //================
    WiFi.mode(WIFI_STA);
    WiFi.begin(ACCESS_POINT_SSID, ACCESS_POINT_PASSWORD);  //Connect to the WiFi network
    //WiFi.enableAP(0);
    while (WiFi.waitForConnectResult() != WL_CONNECTED) {
      //Serial.println("Connection Failed! Rebooting...");
      delay(5000);
      ESP.restart();
    }
    //Serial.println(WiFi.localIP());
  }

  //===================
  //Arduino OTA Updater
  //===================
  /*
    Port defaults to 8266
    ArduinoOTA.setPort(8266);

    Hostname defaults to esp8266-[ChipID]
    ArduinoOTA.setHostname("inverter");

    No authentication by default
    ArduinoOTA.setPassword("admin");

    Password can be set with it's md5 value as well
    MD5(admin) = 21232f297a57a5a743894a0e4a801fc3
    ArduinoOTA.setPasswordHash("21232f297a57a5a743894a0e4a801fc3");
  */
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else { // U_SPIFFS
      type = "filesystem";
      SPIFFS.end(); //unmount SPIFFS
    }
    //Serial.println("Start updating " + type);
  });
  /*
    ArduinoOTA.onEnd([]() {
    Debug.println("\nEnd");
    });
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    DEBUG.printf("Progress: %u%%\r", (progress / (total / 100)));
    });
    ArduinoOTA.onError([](ota_error_t error) {
    //DEBUG.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Debug.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Debug.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Debug.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Debug.println("Receive Failed");
    else if (error == OTA_END_ERROR) Debug.println("End Failed");
    });
  */
  ArduinoOTA.begin();

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
  server.on("/nvram", HTTP_GET, []() {
    NVRAM();
  });
  server.on("/nvram", HTTP_POST, []() {
    NVRAMUpload();
  });
  server.on("/serial.php", HTTP_GET, []() {
    if (server.hasArg("init"))
    {
      //flushSerial();

      Serial.end();
      Serial.begin(server.arg("init").toInt(), SERIAL_8N1);

      server.send(200, text_plain, "OK");
    }
    else if (server.hasArg("get"))
    {
      //DEBUG
      //server.send(200, text_plain, "M,R:M222,V061,c020,v246,E");
      //server.send(200, text_plain, "M,D000,C096,V334,T038,O001,Ssss,E");

      String out = flushSerial();
      server.send(200, text_plain, out);
    }
    else if (server.hasArg("command"))
    {
      String out = readSerial(server.arg("command"));
      Debug.println(out);
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

  //==========
  //DNS Server
  //==========
  /* http://inverter.local */
  /*
    MDNS.begin("inverter");
    MDNS.addService("http", "tcp", 80);
    MDNS.addService("telnet", "tcp", 23);
    MDNS.addService("arduino", "tcp", 8266);
  */

  //===================
  //Remote Telnet Debug
  //===================
  Debug.begin("inverter"); // Telnet server
  //Debug.setPassword(ACCESS_POINT_PASSWORD); // Telnet password
  Debug.setResetCmdEnabled(true); // Enable the reset command
  //Debug.showProfiler(true); // To show profiler - time between messages of Debug
  //Debug.showColors(true); // Colors
  //Debug.showDebugLevel(false); // To not show debug levels
  //Debug.showTime(true); // To show time
  //Debug.setSerialEnabled(true); // Serial echo

  pinMode(LED_BUILTIN, OUTPUT);
}

void loop()
{
  Debug.handle();
  ArduinoOTA.handle();
  server.handleClient();
  yield();
}

//=============
// NVRAM CONFIG
//=============
void NVRAM()
{
  String out = "{\n";
  for (uint8_t i = 0; i <= 3; i++) {
    out += "\t\"nvram" + String(i) + "\": \"" + NVRAM_Read(i) + "\",\n";
  }

  //skip plaintext password (4)

  for (uint8_t i = 5; i <= 6; i++) {
    out += "\t\"nvram" + String(i) + "\": \"" + NVRAM_Read(i) + "\",\n";
  }

  out = out.substring(0, (out.length() - 2));
  out += "\n}";

  server.send(200, text_json, out);
}

void NVRAMUpload()
{
  NVRAM_Erase();

  String out = "<pre>";

  for (uint8_t i = 0; i <= 4; i++) {
    out += server.argName(i) + ": ";
    NVRAM_Write(i, server.arg(i));
    out += NVRAM_Read(i) + "\n";
  }

  //skip confirm password (5)

  for (uint8_t i = 6; i <= 7; i++) {
    out += server.argName(i) + ": ";
    NVRAM_Write(i - 1, server.arg(i));
    out += NVRAM_Read(i - 1) + "\n";
  }
  out += "\n...Rebooting";
  out += "</pre>";

  server.sendHeader("Refresh", "8; url=/esp8266.php");
  server.send(200, text_html, out);

  delay(4000);
  ESP.restart();
}

void NVRAM_Erase()
{
  for (uint16_t i = 0 ; i < EEPROM.length() ; i++) {
    EEPROM.write(i, 0);
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
  //Debug.println(line);

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

      //Debug.println("include:" + include);

      File f = SPIFFS.open("/" + include, "r");
      if (!f)
      {
        //Debug.println(include + " (file not found)");

      } else {

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
  Debug.println((server.method() == HTTP_GET) ? "GET" : "POST");
  Debug.println(file);

  if (SPIFFS.exists(file))
  {
    File f = SPIFFS.open(file, "r");
    if (f)
    {
      digitalWrite(LED_BUILTIN, HIGH);
      //Debug.println(f.size());

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
  else if (filename.endsWith(".htm")) return text_html;
  else if (filename.endsWith(".html")) return text_html;
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".json")) return text_json;
  else if (filename.endsWith(".png")) return "image/png";
  else if (filename.endsWith(".jpg")) return "image/jpeg";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  else if (filename.endsWith(".svg")) return "image/svg+xml";
  else if (filename.endsWith(".pdf")) return "application/x-pdf";
  else if (filename.endsWith(".zip")) return "application/x-zip";
  else if (filename.endsWith(".csv")) return "text/csv";
  return text_plain;
}

//===================
// SERIAL PROCESSING
//===================
String flushSerial()
{
  String output;
  uint8_t timeout = 8;

  while (Serial.available() && timeout > 0) {
    output = Serial.readString(); //flush all previous output
    timeout--;
  }
  return output;
}

String readSerial(String cmd)
{
  char b[255];
  String output = flushSerial();

  //Debug.println(cmd);

  Serial.print(cmd);
  Serial.print("\n");
  Serial.readStringUntil('\n'); //consume echo
  //for (uint16_t i = 0; i <= cmd.length() + 1; i++)
  //  Serial.read();
  size_t len = 0;
  do {
    memset(b, 0, sizeof(b));
    len = Serial.readBytes(b, sizeof(b) - 1);
    output += b;
  } while (len > 0);

  //Debug.println(output);

  return output;
}
