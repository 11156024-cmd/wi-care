# Wi-Care 跌倒檢測系統 - ESP32-S3 集成指南

## 功能概述

本應用現已支持 ESP32-S3 開發板的集成，可以實現：
- ✅ 跌倒檢測時自動亮紅色燈
- ✅ 安全狀態時亮綠色燈
- ✅ 支持紅色閃爍緊急警報
- ✅ 實時 WebSocket 和 HTTP API 雙通信方式

## 硬件需求

- **ESP32-S3 開發板**（推薦使用 ESP32-S3-DevKitC-1）
- **RGB LED** 或 **WS2812B 可尋址 LED 燈條**
- **USB 電纜**用於上傳代碼

## 接線圖

### RGB LED 接線（普通 3 色 LED）

```
ESP32-S3 GPIO 引腳對應：
- GPIO 17 → 紅色 LED
- GPIO 18 → 綠色 LED  
- GPIO 19 → 藍色 LED
- GND → LED 公共陰極
```

### WS2812B 可尋址 LED 接線

```
- GPIO 8 → 數據線（DIN）
- 5V → 電源正極
- GND → 電源負極
```

## ESP32-S3 Arduino 代碼示例

### 方案 1：使用 WebSocket 服務器

```cpp
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// WiFi 設置
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// GPIO 引腳
#define LED_RED 17
#define LED_GREEN 18
#define LED_BLUE 19

// WebSocket 服務器（監聽 8080 連接埠）
WebSocketsServer webSocket = WebSocketsServer(8080);

void setup() {
  Serial.begin(115200);
  
  // 初始化 LED 引腳
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  
  // 連接 WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi 已連接");
  Serial.print("IP 地址: ");
  Serial.println(WiFi.localIP());
  
  // 啟動 WebSocket 服務器
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  // 初始設置為綠色（安全）
  setLEDColor("green");
}

void loop() {
  webSocket.loop();
  delay(10);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if(type == WStype_TEXT) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      String color = doc["color"] | "off";
      setLEDColor(color);
      Serial.println("LED 顏色已更新: " + color);
    }
  }
}

void setLEDColor(String color) {
  if (color == "red") {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_BLUE, LOW);
  }
  else if (color == "green") {
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_BLUE, LOW);
  }
  else if (color == "blue") {
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_BLUE, HIGH);
  }
  else { // off
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_BLUE, LOW);
  }
}
```

### 方案 2：使用 HTTP REST API

```cpp
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

#define LED_RED 17
#define LED_GREEN 18
#define LED_BLUE 19

WebServer server(8080);

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  
  // 連接 WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // 設置 HTTP 路由
  server.on("/api/led/control", HTTP_POST, handleLEDControl);
  server.begin();
  
  setLEDColor("green");
}

void loop() {
  server.handleClient();
  delay(10);
}

void handleLEDControl() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    // 解析 JSON 並提取顏色參數
    // 設置 LED
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else {
    server.send(400, "application/json", "{\"status\":\"error\"}");
  }
}

void setLEDColor(String color) {
  // LED 控制邏輯...
}
```

## 應用設置步驟

### 1. 打開 ESP32 設置對話框

點擊頭部工具欄中的 **紫色警告圖標** (⚠️)，打開 ESP32 設置對話框

### 2. 輸入設備信息

- **ESP32 IP 地址**：輸入你的 ESP32-S3 開發板在網絡中的 IP 地址
  - 可在 Arduino IDE 序列監視器中查看
  - 或在路由器管理界面查看連接設備列表

- **連接埠**：輸入設備運行的服務埠（默認 8080）

- **連接方式**：選擇使用 WebSocket 或 HTTP API

### 3. 測試連接

點擊「測試並保存」按鈕驗證連接。應用會嘗試連接到 ESP32 設備。

## 工作流程

```
┌─────────────────┐
│  跌倒檢測系統   │
└────────┬────────┘
         │
    檢測到跌倒
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  觸發警報       │ ──→  │  ESP32-S3 LED    │
│  (聲音/振動)    │      │  (紅色閃爍)      │
└─────────────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  發送 LINE 通知 │
└─────────────────┘
```

## 故障排除

### LED 無法亮起

1. **檢查硬件連接**：確認 ESP32 與 LED 的接線正確
2. **檢查 GPIO 引腳號**：確認代碼中的 GPIO 號與硬件連接相符
3. **檢查 ESP32 上傳代碼**：使用 Arduino IDE 驗證代碼無誤

### 無法連接到 ESP32

1. **檢查 WiFi 連接**：確保 ESP32 和瀏覽器在同一 WiFi 網絡中
2. **檢查 IP 地址和埠號**：在 ESP32 序列監視器中確認正確的 IP 和埠
3. **檢查防火牆**：確保防火牆未阻止 8080 埠
4. **重啟 ESP32**：長按 RST 按鈕重啟開發板

### WebSocket 連接超時

- 切換至 **HTTP API** 連接方式試試
- 確認 ESP32 端代碼包含 WebSocket 服務器實現

## API 參考

### WebSocket 消息格式

```json
{
  "type": "led_control",
  "color": "red|green|blue|off",
  "timestamp": "2025-12-14T10:30:00.000Z"
}
```

### HTTP POST 請求

```
POST http://YOUR_ESP32_IP:8080/api/led/control

Content-Type: application/json

{
  "color": "red",
  "timestamp": "2025-12-14T10:30:00.000Z"
}
```

## 支持的 LED 顏色

- `red` - 紅色
- `green` - 綠色
- `blue` - 藍色
- `off` - 關閉

## 常見問題

**Q: 可以使用 WS2812B RGB 燈條嗎？**
A: 可以，但需要額外的庫支持（如 FastLED）。請修改 setLEDColor 函數使用對應的 LED 控制代碼。

**Q: 我想要其他顏色的 LED？**
A: 可以在 esp32Service 中添加更多顏色支持，並相應修改 ESP32 代碼。

**Q: 支持多個 ESP32 設備嗎？**
A: 當前版本支持單個 ESP32 設備。多設備支持需要修改服務架構。

## 安全建議

- 不要在生產環境中使用默認的 WiFi 密碼
- 考慮實現 WebSocket 身份驗證機制
- 定期更新 ESP32 固件和依賴庫
