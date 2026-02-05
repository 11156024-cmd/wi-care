/**
 * Wi-Care 應用程式常數設定
 * 集中管理所有應用程式設定與常數
 */

// ========================================
// 環境變數讀取
// ========================================

/**
 * 取得環境變數，若不存在則回傳預設值
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env: Record<string, string> }).env) {
    return (import.meta as ImportMeta & { env: Record<string, string> }).env[key] ?? defaultValue;
  }
  return defaultValue;
};

// ========================================
// ESP32 設備設定
// ========================================

export const ESP32_CONFIG = {
  /** ESP32 預設主機位址 */
  DEFAULT_HOST: getEnvVar('VITE_ESP32_HOST', '192.168.0.101'),
  
  /** ESP32 預設連接埠 */
  DEFAULT_PORT: parseInt(getEnvVar('VITE_ESP32_PORT', '8080'), 10),
  
  /** 連線逾時時間 (毫秒) */
  TIMEOUT: parseInt(getEnvVar('VITE_ESP32_TIMEOUT', '5000'), 10),
  
  /** 重試次數 */
  RETRY_COUNT: 3,
  
  /** 重試延遲 (毫秒) */
  RETRY_DELAY: 1000,
  
  /** WebSocket 重連間隔 (毫秒) */
  RECONNECT_INTERVAL: 5000,
  
  /** 心跳檢測間隔 (毫秒) */
  HEARTBEAT_INTERVAL: 10000,
} as const;

// ========================================
// API 設定
// ========================================

export const API_CONFIG = {
  /** 後端 API 基礎 URL */
  BASE_URL: getEnvVar('VITE_API_URL', 'http://localhost:3001/api'),
  
  /** 請求逾時時間 (毫秒) */
  TIMEOUT: 30000,
  
  /** 最大重試次數 */
  MAX_RETRIES: 3,
} as const;

// ========================================
// 應用程式設定
// ========================================

export const APP_CONFIG = {
  /** 應用程式名稱 */
  NAME: 'Wi-Care',
  
  /** 版本號 */
  VERSION: '1.0.0',
  
  /** 預設語言 */
  DEFAULT_LANGUAGE: 'zh-TW',
  
  /** 開發者模式 */
  DEV_MODE: getEnvVar('VITE_DEV_TOOLS', 'false') === 'true',
  
  /** 詳細日誌 */
  VERBOSE_LOGGING: getEnvVar('VITE_VERBOSE_LOGGING', 'false') === 'true',
} as const;

// ========================================
// 安全性設定
// ========================================

export const SECURITY_CONFIG = {
  /** 密碼最小長度 */
  PASSWORD_MIN_LENGTH: 8,
  
  /** 密碼最大長度 */
  PASSWORD_MAX_LENGTH: 128,
  
  /** Token 有效期限 (毫秒) */
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 小時
  
  /** 登入嘗試次數限制 */
  MAX_LOGIN_ATTEMPTS: 5,
  
  /** 帳戶鎖定時間 (毫秒) */
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 分鐘
  
  /** Rate Limiting 時間窗口 (毫秒) */
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 分鐘
  
  /** Rate Limiting 最大請求數 */
  RATE_LIMIT_MAX_REQUESTS: 60,
} as const;

// ========================================
// UI/UX 設定
// ========================================

export const UI_CONFIG = {
  /** Toast 通知預設持續時間 (毫秒) */
  TOAST_DURATION: 3000,
  
  /** 動畫持續時間 (毫秒) */
  ANIMATION_DURATION: 300,
  
  /** 分頁預設每頁筆數 */
  DEFAULT_PAGE_SIZE: 10,
  
  /** 分頁選項 */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as readonly number[],
  
  /** 日期格式 */
  DATE_FORMAT: 'YYYY-MM-DD',
  
  /** 時間格式 */
  TIME_FORMAT: 'HH:mm:ss',
  
  /** 日期時間格式 */
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
} as const;

// ========================================
// 跌倒偵測設定
// ========================================

export const FALL_DETECTION_CONFIG = {
  /** 風險閾值 - 低 */
  RISK_THRESHOLD_LOW: 0.3,
  
  /** 風險閾值 - 中 */
  RISK_THRESHOLD_MEDIUM: 0.6,
  
  /** 風險閾值 - 高 */
  RISK_THRESHOLD_HIGH: 0.85,
  
  /** 警報確認時間 (毫秒) */
  ALERT_CONFIRMATION_TIME: 30000,
  
  /** CSI 採樣頻率 (Hz) */
  CSI_SAMPLE_RATE: 100,
  
  /** 波形顯示資料點數 */
  WAVEFORM_DATA_POINTS: 100,
} as const;

// ========================================
// 路由設定
// ========================================

export const ROUTES = {
  HOME: '/',
  MONITOR: '/monitor',
  CAREGIVERS: '/caregivers',
  DEVICES: '/devices',
  HEALTH_LOG: '/health-log',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const;

// ========================================
// 本地儲存鍵值
// ========================================

export const STORAGE_KEYS = {
  /** 使用者 Token */
  AUTH_TOKEN: 'wicare_auth_token',
  
  /** 使用者偏好設定 */
  USER_PREFERENCES: 'wicare_user_preferences',
  
  /** ESP32 連線設定 */
  ESP32_SETTINGS: 'wicare_esp32_settings',
  
  /** 最近的健康紀錄 */
  RECENT_HEALTH_LOGS: 'wicare_recent_logs',
  
  /** 通知設定 */
  NOTIFICATION_SETTINGS: 'wicare_notification_settings',
} as const;

// ========================================
// 錯誤訊息
// ========================================

export const ERROR_MESSAGES = {
  // 網路錯誤
  NETWORK_ERROR: '網路連線失敗，請檢查網路狀態',
  TIMEOUT_ERROR: '連線逾時，請稍後再試',
  
  // 驗證錯誤
  INVALID_CREDENTIALS: '帳號或密碼錯誤',
  SESSION_EXPIRED: '登入已過期，請重新登入',
  UNAUTHORIZED: '您沒有權限執行此操作',
  
  // 表單錯誤
  REQUIRED_FIELD: '此欄位為必填',
  INVALID_EMAIL: '請輸入有效的電子郵件',
  INVALID_PHONE: '請輸入有效的電話號碼',
  PASSWORD_TOO_SHORT: `密碼至少需要 ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} 個字元`,
  PASSWORD_MISMATCH: '兩次輸入的密碼不一致',
  
  // ESP32 錯誤
  ESP32_CONNECTION_FAILED: 'ESP32 連線失敗，請確認設備已開機且網路設定正確',
  ESP32_NOT_FOUND: '找不到 ESP32 設備',
  
  // 一般錯誤
  UNKNOWN_ERROR: '發生未知錯誤，請稍後再試',
  OPERATION_FAILED: '操作失敗，請稍後再試',
} as const;

// ========================================
// 成功訊息
// ========================================

export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '儲存成功',
  DELETE_SUCCESS: '刪除成功',
  UPDATE_SUCCESS: '更新成功',
  LOGIN_SUCCESS: '登入成功',
  LOGOUT_SUCCESS: '已登出',
  EXPORT_SUCCESS: '匯出成功',
  CONNECTION_SUCCESS: '連線成功',
} as const;

// ========================================
// 型別輸出
// ========================================

export type RouteKey = keyof typeof ROUTES;
export type StorageKey = keyof typeof STORAGE_KEYS;
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;
