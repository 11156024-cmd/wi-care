#include <WiFi.h>

// 將以下替換為你的 Wi-Fi SSID 與密碼
const char* ssid = "火腿蛋餅";
const char* password = "a0983397137";

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nESP32 IP Print Example");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
    // 超時 20 秒會中斷以避免無限等待
    if (millis() - start > 20000) {
      Serial.println("\nFailed to connect within 20s");
      break;
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Netmask: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
  } else {
    Serial.println("Could not connect to WiFi. Check SSID/password and try again.");
  }
}

void loop() {
  // 每 60 秒再印一次 IP（如果想要定期更新）
  delay(60000);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[periodic] IP: ");
    Serial.println(WiFi.localIP());
  }
}
