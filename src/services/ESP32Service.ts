/**
 * ESP32-S3 Development Board Service
 * 用於控制 ESP32-S3 開發板上的 LED 和其他功能
 * 
 * 支持兩種通信方式：
 * 1. WebSocket（推薦）- 用於實時通信
 * 2. HTTP REST API - 用於簡單控制
 */

export enum LEDColor {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  OFF = 'off'
}

export interface ESP32Config {
  host: string;
  port: number;
  useWebSocket?: boolean;
}

class ESP32Service {
  private config: ESP32Config;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  constructor(config: ESP32Config = { host: '172.20.10.9', port: 8080, useWebSocket: false }) {
    this.config = config;
  }

  /**
   * 連接到 ESP32 設備
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.config.useWebSocket !== false) {
        this.connectWebSocket(resolve, reject);
      } else {
        // 如果不使用 WebSocket，直接標記為已連接（使用 HTTP）
        this.isConnected = true;
        resolve();
      }
    });
  }

  /**
   * WebSocket 連接
   */
  private connectWebSocket(resolve: () => void, reject: (error: Error) => void): void {
    try {
      const wsUrl = `ws://${this.config.host}:${this.config.port}/ws`;
      console.log(`[ESP32] 正在連接到 WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[ESP32] WebSocket 已連接');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        console.log('[ESP32] 接收到消息:', event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[ESP32] WebSocket 錯誤:', error);
        this.handleConnectionError(reject);
      };

      this.ws.onclose = () => {
        console.log('[ESP32] WebSocket 已斷開');
        this.isConnected = false;
        this.attemptReconnect();
      };
    } catch (error) {
      this.handleConnectionError(reject);
    }
  }

  /**
   * 處理連接錯誤和重新連接
   */
  private handleConnectionError(reject?: (error: Error) => void): void {
    this.isConnected = false;
    
    if (reject) {
      reject(new Error('無法連接到 ESP32 設備'));
    }

    this.attemptReconnect();
  }

  /**
   * 嘗試重新連接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[ESP32] ${this.reconnectDelay}ms 後進行第 ${this.reconnectAttempts} 次重新連接...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('[ESP32] 重新連接失敗:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('[ESP32] 達到最大重新連接次數，停止嘗試');
    }
  }

  /**
   * 控制 LED 顏色 - WebSocket 方式
   */
  private async controlLEDWebSocket(color: LEDColor): Promise<boolean> {
    if (!this.isConnected || !this.ws) {
      console.warn('[ESP32] WebSocket 未連接');
      return false;
    }

    try {
      const command = {
        type: 'led_control',
        color: color,
        timestamp: new Date().toISOString()
      };

      this.ws.send(JSON.stringify(command));
      console.log(`[ESP32] 已發送 LED 命令: ${color}`);
      return true;
    } catch (error) {
      console.error('[ESP32] 發送 WebSocket 命令失敗:', error);
      return false;
    }
  }

  /**
   * 控制 LED 顏色 - HTTP REST API 方式
   */
  private async controlLEDHTTP(color: LEDColor): Promise<boolean> {
    try {
      const url = `http://${this.config.host}:${this.config.port}/api/led/control`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          color: color,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log(`[ESP32] LED 已控制為: ${color}`);
        return true;
      } else {
        console.error(`[ESP32] HTTP 請求失敗: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('[ESP32] HTTP 請求錯誤:', error);
      return false;
    }
  }

  /**
   * 設置 LED 顏色的公共方法
   */
  public async setLED(color: LEDColor): Promise<boolean> {
    console.log(`[ESP32] 設置 LED 為: ${color}`);

    if (this.config.useWebSocket !== false && this.isConnected) {
      return this.controlLEDWebSocket(color);
    } else {
      return this.controlLEDHTTP(color);
    }
  }

  /**
   * 觸發緊急警報 - 紅色閃爍
   */
  public async triggerEmergencyAlarm(): Promise<boolean> {
    console.log('[ESP32] 觸發緊急警報 - 紅色閃爍');
    
    // 發送多次閃爍命令
    for (let i = 0; i < 5; i++) {
      await this.setLED(LEDColor.RED);
      await new Promise(resolve => setTimeout(resolve, 200));
      await this.setLED(LEDColor.OFF);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 最後保持紅色
    return this.setLED(LEDColor.RED);
  }

  /**
   * 恢復安全狀態 - 綠色
   */
  public async setToSafe(): Promise<boolean> {
    console.log('[ESP32] 設置為安全狀態 - 綠色');
    return this.setLED(LEDColor.GREEN);
  }

  /**
   * 關閉 LED
   */
  public async turnOffLED(): Promise<boolean> {
    console.log('[ESP32] 關閉 LED');
    return this.setLED(LEDColor.OFF);
  }

  /**
   * 斷開連接
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    console.log('[ESP32] 已斷開連接');
  }

  /**
   * 獲取連接狀態
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 獲取配置信息
   */
  public getConfig(): ESP32Config {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ESP32Config>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[ESP32] 配置已更新:', this.config);
  }
}

// 創建單例實例
export const esp32Service = new ESP32Service({
  host: 'localhost',  // 修改為你的 ESP32 IP 地址
  port: 8080,          // 修改為你的 ESP32 端口
  useWebSocket: true
});

export default esp32Service;
