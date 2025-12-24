#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <MPU6050.h>

// WiFi Configuration
const char* ssid = "火腿蛋餅";
const char* password = "12345678";

// ESP32-S3 Pin Configuration
#define LED_RED 17
#define LED_GREEN 18
#define LED_BLUE 19
#define BUZZER_PIN 15

// MPU6050 三軸加速度感測器
MPU6050 mpu;

// Web Server
WebServer server(8080);

// Global State
struct DeviceState {
  bool falling = false;
  bool wasMoving = false;
  unsigned long fallDetectedTime = 0;
  float accelX = 0, accelY = 0, accelZ = 0;
  float gyroX = 0, gyroY = 0, gyroZ = 0;
  float magnitude = 0;
  unsigned long timestamp = 0;
  const char* device_id = "ESP32-S3-001";
} state;

// Thresholds for fall detection
const float FALL_THRESHOLD = 1.8;  // G units - sudden acceleration
const float STATIC_THRESHOLD = 0.3; // G units - device is stationary
const int FALL_CONFIRMATION_TIME = 300; // ms - time to confirm fall

// ==================== WiFi Setup ====================
void setupWiFi() {
  Serial.println("[WiFi] 連接到網路...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
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
    setLED(0, 255, 0); // Green - WiFi connected
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    setLED(255, 0, 0); // Red - WiFi error
  }
}

// ==================== LED Control ====================
void setLED(uint8_t r, uint8_t g, uint8_t b) {
  digitalWrite(LED_RED, r > 127 ? HIGH : LOW);
  digitalWrite(LED_GREEN, g > 127 ? HIGH : LOW);
  digitalWrite(LED_BLUE, b > 127 ? HIGH : LOW);
}

void blinkRed() {
  for (int i = 0; i < 5; i++) {
    setLED(255, 0, 0); // Red
    delay(200);
    setLED(0, 0, 0);   // Off
    delay(200);
  }
}

// ==================== Sensor & Fall Detection ====================
void initSensor() {
  Wire.begin(8, 9); // SDA=GPIO8, SCL=GPIO9 (ESP32-S3 defaults)
  
  if (!mpu.begin(MPU6050_SCALE_2000DPS, MPU6050_RANGE_16G)) {
    Serial.println("[Sensor] MPU6050 initialization failed!");
    setLED(255, 0, 0); // Red error
    while (1) delay(100);
  }
  
  Serial.println("[Sensor] MPU6050 initialized successfully");
  mpu.setAutoSleep(true);
}

// Advanced fall detection algorithm
bool detectFall() {
  Vector rawAccel = mpu.readRawAccel();
  Vector accel = mpu.readNormalizeAccel();
  Vector gyro = mpu.readNormalizeGyro();
  
  state.accelX = accel.XAxis;
  state.accelY = accel.YAxis;
  state.accelZ = accel.ZAxis;
  state.gyroX = gyro.XAxis;
  state.gyroY = gyro.YAxis;
  state.gyroZ = gyro.ZAxis;
  state.timestamp = millis();
  
  // Calculate acceleration magnitude (G units)
  state.magnitude = sqrt(
    state.accelX * state.accelX + 
    state.accelY * state.accelY + 
    state.accelZ * state.accelZ
  );
  
  // Fall Detection Logic:
  // 1. Sudden upward acceleration (thrown downward or falling impact)
  // 2. Followed by rapid movement in all axes
  // 3. Then sudden drop to near-zero acceleration (device at rest on ground)
  
  bool isSuddenAccel = state.magnitude > FALL_THRESHOLD;
  bool isHighGyro = (abs(state.gyroX) > 200 || abs(state.gyroY) > 200 || abs(state.gyroZ) > 200);
  bool isStationary = state.magnitude < STATIC_THRESHOLD;
  
  // Detect fall pattern: high accel + high rotation + sudden stationary
  if ((isSuddenAccel && isHighGyro) || (state.magnitude > 2.5 && isStationary)) {
    if (!state.falling) {
      state.falling = true;
      state.fallDetectedTime = millis();
      Serial.println("[Fall] ⚠️ FALL DETECTED!");
      Serial.print("  Magnitude: "); Serial.print(state.magnitude); Serial.println(" G");
      Serial.print("  Gyro X: "); Serial.print(state.gyroX); Serial.println(" °/s");
      blinkRed();
      tone(BUZZER_PIN, 1000, 500); // 1kHz for 500ms
    }
    return true;
  }
  
  // Recovery: if acceleration is low for extended period
  if (state.falling && isStationary && (millis() - state.fallDetectedTime > 2000)) {
    state.falling = false;
    Serial.println("[Fall] ✓ Recovery detected");
    setLED(0, 255, 0); // Green
    noTone(BUZZER_PIN);
    return false;
  }
  
  return state.falling;
}

// ==================== HTTP Handlers ====================
void handleStatus() {
  detectFall(); // Update sensor readings
  
  StaticJsonDocument<256> doc;
  doc["status"] = state.falling ? "fall" : "safe";
  doc["falling"] = state.falling;
  doc["timestamp"] = state.timestamp;
  doc["device_id"] = state.device_id;
  doc["accelX"] = state.accelX;
  doc["accelY"] = state.accelY;
  doc["accelZ"] = state.accelZ;
  doc["magnitude"] = state.magnitude;
  doc["gyroX"] = state.gyroX;
  doc["gyroY"] = state.gyroY;
  doc["gyroZ"] = state.gyroZ;
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
}

void handleTriggerFall() {
  state.falling = true;
  state.fallDetectedTime = millis();
  setLED(255, 0, 0); // Red
  blinkRed();
  tone(BUZZER_PIN, 1000, 500);
  
  StaticJsonDocument<128> doc;
  doc["status"] = "fall";
  doc["falling"] = true;
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
  
  Serial.println("[API] Fall manually triggered");
}

void handleClearFall() {
  state.falling = false;
  setLED(0, 255, 0); // Green
  noTone(BUZZER_PIN);
  
  StaticJsonDocument<128> doc;
  doc["status"] = "safe";
  doc["falling"] = false;
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
  
  Serial.println("[API] Fall state cleared");
}

void handleHealth() {
  StaticJsonDocument<128> doc;
  doc["status"] = "ok";
  doc["uptime_ms"] = millis();
  doc["wifi_rssi"] = WiFi.RSSI();
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleNotFound() {
  server.send(404, "text/plain", "Not Found");
}

// ==================== Setup & Loop ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("Wi-Care ESP32-S3 Fall Detection System");
  Serial.println("With Real Accelerometer Data");
  Serial.println("========================================\n");
  
  // GPIO Setup
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  setLED(255, 255, 255); // White - initializing
  
  // Initialize Sensor
  initSensor();
  
  // WiFi Setup
  setupWiFi();
  
  // HTTP Server Routes
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/trigger-fall", HTTP_POST, handleTriggerFall);
  server.on("/clear-fall", HTTP_POST, handleClearFall);
  server.on("/health", HTTP_GET, handleHealth);
  server.onNotFound(handleNotFound);
  
  server.begin();
  Serial.println("[Server] HTTP Server started on port 8080");
  Serial.println("Available endpoints:");
  Serial.println("  GET  /status         - Get current device status");
  Serial.println("  POST /trigger-fall   - Manually trigger fall");
  Serial.println("  POST /clear-fall     - Clear fall state");
  Serial.println("  GET  /health         - Server health check");
  
  setLED(0, 255, 0); // Green - ready
}

void loop() {
  server.handleClient();
  
  // Continuous fall detection
  detectFall();
  
  // Update LED based on state
  if (state.falling) {
    setLED(255, 0, 0); // Red when falling
  } else {
    setLED(0, 255, 0); // Green when safe
  }
  
  delay(100); // 100ms loop
}
