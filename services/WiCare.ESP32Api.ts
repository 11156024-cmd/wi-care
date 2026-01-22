import { DeviceData } from '../WiCare.Types';

/**
 * Wi-Care ESP32-S3 真實硬體 API 服務
 * 
 * 基於 ESPectre 專案的參數配置：
 * - traffic_generator_rate: 100 (CSI 封包發送頻率)
 * - segmentation_threshold: 1.0 (分割閾值)
 * - segmentation_window_size: 50 (分割窗口大小)
 * 
 * @see https://github.com/francescopace/espectre
 */

// ESP32-S3 伺服器設定 - 真實硬體連接
const ESP32_SERVER = {
  host: '172.20.10.9', // ESP32-S3 實際 IP 位址
  port: 8080,
  protocol: 'http'
};

// 連線狀態追蹤
let isConnected = false;
let lastSuccessfulConnection = 0;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const CONNECTION_TIMEOUT = 5000; // 5 秒

// 構建完整的 ESP32 伺服器 URL
const getESP32URL = (endpoint: string): string => {
  return `${ESP32_SERVER.protocol}://${ESP32_SERVER.host}:${ESP32_SERVER.port}${endpoint}`;
};

/**
 * 從 ESP32-S3 跌倒檢測伺服器獲取真實數據
 * 
 * 端點：GET http://ESP32_IP:8080/status
 * 回應格式：{ 
 *   "status": "safe" | "fall", 
 *   "falling": boolean, 
 *   "timestamp": number, 
 *   "device_id": string,
 *   "movement_score": number (可選，來自 ESPectre)
 * }
 * 
 * 注意：此函數只返回真實數據，不會生成模擬數據
 */
export const fetchDeviceStatus = async (shouldFail: boolean = false): Promise<DeviceData> => {
  if (shouldFail) {
    throw new Error("Manual fail flag enabled");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

  try {
    connectionAttempts++;
    
    const response = await fetch(getESP32URL('/status'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      isConnected = false;
      throw new Error(`ESP32 伺服器錯誤: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // 更新連線狀態
    isConnected = true;
    lastSuccessfulConnection = Date.now();
    connectionAttempts = 0;

    console.log('[ESP32-API] 真實數據:', {
      status: data.status,
      falling: data.falling,
      device_id: data.device_id,
      movement_score: data.movement_score || 'N/A'
    });

    return {
      status: data.status === 'fall' || data.falling === true ? 'fall' : 'safe',
      timestamp: new Date().toISOString(),
      device_id: data.device_id || 'ESP32-S3-001'
    };

  } catch (error) {
    clearTimeout(timeoutId);
    isConnected = false;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 分類處理不同類型的錯誤
    if (errorMessage.includes('abort')) {
      console.error('[ESP32-API] 連線逾時 (5秒)');
      throw new Error('ESP32 連線逾時 - 請檢查設備是否在線');
    }
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      console.error('[ESP32-API] 網路錯誤 - ESP32 可能未啟用 CORS');
      throw new Error('ESP32 無法連線 - 設備離線或網路問題');
    }
    
    console.error('[ESP32-API] 連線失敗:', errorMessage);
    throw new Error(`ESP32 連線錯誤: ${errorMessage}`);
  }
};

/**
 * 手動觸發 ESP32 上的跌倒檢測（測試用途）
 * 端點：POST http://ESP32_IP:8080/trigger-fall
 * 
 * 注意：此函數會拋出錯誤，不會返回 false
 */
export const triggerESP32FallDetection = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

  try {
    const response = await fetch(getESP32URL('/trigger-fall'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ESP32 回應錯誤: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[ESP32-API] 跌倒已觸發:', data);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ESP32-API] 無法觸發跌倒:', errorMessage);
    throw new Error(`ESP32 觸發跌倒失敗: ${errorMessage}`);
  }
};

/**
 * 清除 ESP32 上的跌倒狀態
 * 端點：POST http://ESP32_IP:8080/clear-fall
 * 
 * 注意：此函數會拋出錯誤，不會返回 false
 */
export const clearESP32FallDetection = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

  try {
    const response = await fetch(getESP32URL('/clear-fall'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ESP32 回應錯誤: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[ESP32-API] 跌倒狀態已清除:', data);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ESP32-API] 無法清除跌倒狀態:', errorMessage);
    throw new Error(`ESP32 清除跌倒失敗: ${errorMessage}`);
  }
};

/**
 * 更新 ESP32 伺服器的設定（允許運行時更改 IP 位址和端口）
 */
export const updateESP32Config = (newHost: string, newPort: number): void => {
  ESP32_SERVER.host = newHost;
  ESP32_SERVER.port = newPort;
  // 重置連線狀態
  isConnected = false;
  lastSuccessfulConnection = 0;
  console.log('[ESP32-API] ESP32 設定已更新:', ESP32_SERVER);
};

/**
 * 檢查 ESP32 是否已連線
 */
export const isESP32Connected = (): boolean => {
  return isConnected;
};

/**
 * 取得最後一次成功連線的時間戳
 */
export const getLastConnectionTime = (): number => {
  return lastSuccessfulConnection;
};

/**
 * 取得 ESP32 連線狀態概況
 */
export const getESP32ConnectionStatus = (): {
  connected: boolean;
  lastConnection: number;
  serverUrl: string;
} => {
  return {
    connected: isConnected,
    lastConnection: lastSuccessfulConnection,
    serverUrl: getESP32URL('')
  };
};

/**
 * 健康檢查 - 快速確認 ESP32 是否可達
 * 端點：GET http://ESP32_IP:8080/health
 */
export const checkESP32Health = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 快速逾時

  try {
    const response = await fetch(getESP32URL('/health'), {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      isConnected = true;
      lastSuccessfulConnection = Date.now();
      return true;
    }
    
    isConnected = false;
    return false;
  } catch (error) {
    clearTimeout(timeoutId);
    isConnected = false;
    return false;
  }
};
