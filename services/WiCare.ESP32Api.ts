import { DeviceData } from '../WiCare.Types';

/**
 * Wi-Care ESP32-S3 ?Ÿå¯¦?¸æ? API ?å?
 * 
 * ?ºæ–¼ ESPectre å°ˆæ??ƒæ•¸?ç½®ï¼? * - traffic_generator_rate: 100 (CSI å°å??Ÿæ??Ÿç?)
 * - segmentation_threshold: 1.0 (?•ä??æ?åº?
 * - segmentation_window_size: 50 (?†æ?çª—å£å¤§å?)
 * 
 * @see https://github.com/francescopace/espectre
 */

// ESP32-S3 ä¼ºæ??¨è¨­å®?- ?Ÿå¯¦ç¡¬é???¥
const ESP32_SERVER = {
  host: '172.20.10.9', // ESP32-S3 å¯¦é? IP ?°å?
  port: 8080,
  protocol: 'http'
};

// ??¥?€?‹è¿½è¹?let isConnected = false;
let lastSuccessfulConnection = 0;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const CONNECTION_TIMEOUT = 5000; // 5 ç§?
// ?²å?å®Œæ•´??ESP32 ä¼ºæ???URL
const getESP32URL = (endpoint: string): string => {
  return `${ESP32_SERVER.protocol}://${ESP32_SERVER.host}:${ESP32_SERVER.port}${endpoint}`;
};

/**
 * å¾?ESP32-S3 è·Œå€’æª¢æ¸¬ä¼º?å™¨?²å??Ÿå¯¦?€?? * 
 * ç«¯é?ï¼šGET http://ESP32_IP:8080/status
 * ?æ??¼å?ï¼š{ 
 *   "status": "safe" | "fall", 
 *   "falling": boolean, 
 *   "timestamp": number, 
 *   "device_id": string,
 *   "movement_score": number (?¯é¸ï¼Œä???ESPectre)
 * }
 * 
 * ? ï? æ­¤å‡½?¸åªè¿”å??Ÿå¯¦?¸æ?ï¼Œä??ä??‡æ•¸?šé?ç´? */
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
      throw new Error(`ESP32 ä¼ºæ??¨éŒ¯èª? HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // ?´æ–°??¥?€??    isConnected = true;
    lastSuccessfulConnection = Date.now();
    connectionAttempts = 0;

    console.log('[ESP32-API] ?Ÿå¯¦?¸æ?:', {
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
    
    // ?€?†ä??Œé??‹ç??¯èª¤
    if (errorMessage.includes('abort')) {
      console.error('[ESP32-API] ????¥è¶…æ? (5ç§?');
      throw new Error('ESP32 ??¥è¶…æ? - è«‹æª¢?¥è¨­?™æ˜¯?¦åœ¨ç·?);
    }
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      console.error('[ESP32-API] ??ç¶²è·¯?¯èª¤ - ESP32 ?¢ç???CORS ?é?');
      throw new Error('ESP32 ?¡æ???¥ - è¨­å??¢ç??–ç¶²è·¯å?é¡?);
    }
    
    console.error('[ESP32-API] ????¥å¤±æ?:', errorMessage);
    throw new Error(`ESP32 ??¥?¯èª¤: ${errorMessage}`);
  }
};

/**
 * ?‹å?è§¸ç™¼ ESP32 ä¸Šç?è·Œå€’æª¢æ¸¬ï?æ¸¬è©¦?¨ï?
 * ç«¯é?ï¼šPOST http://ESP32_IP:8080/trigger-fall
 * 
 * æ³¨æ?ï¼šæ­¤?½æ•¸?ƒæ??ºéŒ¯èª¤ï?ä¸æ?è¿”å? false
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
      throw new Error(`ESP32 ?æ??¯èª¤: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[ESP32-API] ??è·Œå€’å·²è§¸ç™¼:', data);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ESP32-API] ???¡æ?è§¸ç™¼è·Œå€?', errorMessage);
    throw new Error(`ESP32 è§¸ç™¼è·Œå€’å¤±?? ${errorMessage}`);
  }
};

/**
 * æ¸…é™¤ ESP32 ä¸Šç?è·Œå€’ç??? * ç«¯é?ï¼šPOST http://ESP32_IP:8080/clear-fall
 * 
 * æ³¨æ?ï¼šæ­¤?½æ•¸?ƒæ??ºéŒ¯èª¤ï?ä¸æ?è¿”å? false
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
      throw new Error(`ESP32 ?æ??¯èª¤: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[ESP32-API] ??è·Œå€’ç??‹å·²æ¸…é™¤:', data);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ESP32-API] ???¡æ?æ¸…é™¤è·Œå€’ç???', errorMessage);
    throw new Error(`ESP32 æ¸…é™¤è·Œå€’å¤±?? ${errorMessage}`);
  }
};

/**
 * ?´æ–° ESP32 ä¼ºæ??¨è¨­å®šï??¨é?è¡Œæ??¹è? IP ?Œé€?¥? ï?
 */
export const updateESP32Config = (newHost: string, newPort: number): void => {
  ESP32_SERVER.host = newHost;
  ESP32_SERVER.port = newPort;
  // ?ç½®????€??  isConnected = false;
  lastSuccessfulConnection = 0;
  console.log('[ESP32-API] ?”§ ESP32 è¨­å?å·²æ›´??', ESP32_SERVER);
};

/**
 * æª¢æŸ¥ ESP32 ?¯å¦å·²é€?¥
 */
export const isESP32Connected = (): boolean => {
  return isConnected;
};

/**
 * ?–å??€å¾Œä?æ¬¡æ??Ÿé€?¥?„æ??“æˆ³
 */
export const getLastConnectionTime = (): number => {
  return lastSuccessfulConnection;
};

/**
 * ?–å? ESP32 ????€?‹æ?è¦? */
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
 * ?¥åº·æª¢æŸ¥ - å¿«é€Ÿç¢ºèª?ESP32 ?¯å¦?¯é?
 * ç«¯é?ï¼šGET http://ESP32_IP:8080/health
 */
export const checkESP32Health = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // å¿«é€Ÿè???
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
