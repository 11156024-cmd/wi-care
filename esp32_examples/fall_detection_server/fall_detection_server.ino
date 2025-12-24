#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// WiFi 設定
const char* ssid = "emperor";
const char* password = "levinowife";

// Web Server（監聽 8080）
WebServer server(8080);

// 跌倒狀態（可手動切換或由感測器更新）
bool isFalling = false;
unsigned long lastStatusUpdate = 0;

void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("\n\nESP32-S3 Fall Detection Server");
  Serial.println("================================\n");

  // 連接 WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Access server at: http://");
    Serial.print(WiFi.localIP());
    Serial.println(":8080\n");
  } else {
    Serial.println("\n✗ WiFi connection failed. Check SSID/password.");
    return;
  }

  // 設置 HTTP 路由
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/trigger-fall", HTTP_POST, handleTriggerFall);
  server.on("/clear-fall", HTTP_POST, handleClearFall);
  server.on("/health", HTTP_GET, handleHealth);
  
  // 啟動伺服器
  server.begin();
  Serial.println("HTTP Server started on port 8080");
  Serial.println("\nAvailable endpoints:");
  Serial.println("  GET  /status       - Get current fall detection status");
  Serial.println("  POST /trigger-fall - Manually trigger fall detection");
  Serial.println("  POST /clear-fall   - Clear fall detection");
  Serial.println("  GET  /health       - Server health check\n");
}

void loop() {
  server.handleClient();
  delay(10);
}

// GET /status - 取得跌倒狀態
void handleStatus() {
  StaticJsonDocument<200> doc;
  
  doc["status"] = isFalling ? "fall" : "safe";
  doc["falling"] = isFalling;
  doc["timestamp"] = millis();
  doc["device_id"] = "ESP32-S3-001";
  doc["ip"] = WiFi.localIP().toString();

  String response;
  serializeJson(doc, response);

  server.sendHeader("Content-Type", "application/json");
  server.send(200, "application/json", response);

  // 列印到序列埠
  Serial.print("[");
  Serial.print(millis());
  Serial.print("] GET /status -> ");
  Serial.println(response);
}

// POST /trigger-fall - 手動觸發跌倒檢測
void handleTriggerFall() {
  isFalling = true;
  lastStatusUpdate = millis();

  StaticJsonDocument<200> doc;
  doc["message"] = "Fall detection triggered";
  doc["status"] = "fall";
  doc["falling"] = true;

  String response;
  serializeJson(doc, response);

  server.sendHeader("Content-Type", "application/json");
  server.send(200, "application/json", response);

  Serial.print("[");
  Serial.print(millis());
  Serial.println("] POST /trigger-fall -> Fall state activated");
}

// POST /clear-fall - 清除跌倒狀態
void handleClearFall() {
  isFalling = false;
  lastStatusUpdate = millis();

  StaticJsonDocument<200> doc;
  doc["message"] = "Fall detection cleared";
  doc["status"] = "safe";
  doc["falling"] = false;

  String response;
  serializeJson(doc, response);

  server.sendHeader("Content-Type", "application/json");
  server.send(200, "application/json", response);

  Serial.print("[");
  Serial.print(millis());
  Serial.println("] POST /clear-fall -> Fall state cleared");
}

// GET /health - 伺服器狀態檢查
void handleHealth() {
  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
  doc["ip"] = WiFi.localIP().toString();
  doc["uptime_ms"] = millis();

  String response;
  serializeJson(doc, response);

  server.sendHeader("Content-Type", "application/json");
  server.send(200, "application/json", response);
}
