/**
 * Wi-Care 統一錯誤處理模組
 * 提供標準化的錯誤處理、日誌記錄和用戶通知機制
 */

// ========================================
// 錯誤類型定義
// ========================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  DEVICE = 'DEVICE',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
}

// ========================================
// 錯誤碼對照表
// ========================================

const ERROR_MESSAGES: Record<string, { userMessage: string; severity: ErrorSeverity }> = {
  // 網路錯誤
  'NETWORK_OFFLINE': { userMessage: '網路連線已中斷，請檢查您的網路設定', severity: ErrorSeverity.MEDIUM },
  'NETWORK_TIMEOUT': { userMessage: '連線逾時，請稍後再試', severity: ErrorSeverity.LOW },
  'NETWORK_ERROR': { userMessage: '網路錯誤，請檢查連線狀態', severity: ErrorSeverity.MEDIUM },
  
  // 認證錯誤
  'AUTH_INVALID_CREDENTIALS': { userMessage: '帳號或密碼錯誤', severity: ErrorSeverity.LOW },
  'AUTH_TOKEN_EXPIRED': { userMessage: '登入已過期，請重新登入', severity: ErrorSeverity.LOW },
  'AUTH_UNAUTHORIZED': { userMessage: '您沒有權限執行此操作', severity: ErrorSeverity.MEDIUM },
  'AUTH_SESSION_EXPIRED': { userMessage: '連線階段已過期，請重新登入', severity: ErrorSeverity.LOW },
  
  // 驗證錯誤
  'VALIDATION_REQUIRED': { userMessage: '請填寫必填欄位', severity: ErrorSeverity.LOW },
  'VALIDATION_EMAIL': { userMessage: '請輸入有效的電子郵件地址', severity: ErrorSeverity.LOW },
  'VALIDATION_PHONE': { userMessage: '請輸入有效的電話號碼', severity: ErrorSeverity.LOW },
  'VALIDATION_PASSWORD': { userMessage: '密碼格式不正確', severity: ErrorSeverity.LOW },
  
  // 設備錯誤
  'DEVICE_OFFLINE': { userMessage: 'ESP32 設備離線，請檢查設備電源和網路', severity: ErrorSeverity.HIGH },
  'DEVICE_CONNECTION_FAILED': { userMessage: '無法連接設備，請確認 IP 位址是否正確', severity: ErrorSeverity.HIGH },
  'DEVICE_TIMEOUT': { userMessage: '設備回應逾時', severity: ErrorSeverity.MEDIUM },
  
  // 伺服器錯誤
  'SERVER_ERROR': { userMessage: '伺服器發生錯誤，請稍後再試', severity: ErrorSeverity.HIGH },
  'SERVER_UNAVAILABLE': { userMessage: '伺服器暫時無法使用', severity: ErrorSeverity.HIGH },
  
  // 未知錯誤
  'UNKNOWN_ERROR': { userMessage: '發生未知錯誤，請重新整理頁面', severity: ErrorSeverity.MEDIUM }
};

// ========================================
// 錯誤建立工具
// ========================================

export function createAppError(
  type: ErrorType,
  code: string,
  message: string,
  context?: Record<string, unknown>
): AppError {
  const errorInfo = ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'];
  
  return {
    type,
    severity: errorInfo.severity,
    code,
    message,
    userMessage: errorInfo.userMessage,
    timestamp: new Date(),
    context,
    stack: new Error().stack
  };
}

// ========================================
// 錯誤解析工具
// ========================================

export function parseHttpError(status: number, responseMessage?: string): AppError {
  switch (status) {
    case 400:
      return createAppError(ErrorType.VALIDATION, 'VALIDATION_REQUIRED', responseMessage || 'Bad Request');
    case 401:
      return createAppError(ErrorType.AUTHENTICATION, 'AUTH_INVALID_CREDENTIALS', responseMessage || 'Unauthorized');
    case 403:
      return createAppError(ErrorType.AUTHORIZATION, 'AUTH_UNAUTHORIZED', responseMessage || 'Forbidden');
    case 404:
      return createAppError(ErrorType.SERVER, 'SERVER_ERROR', responseMessage || 'Not Found');
    case 408:
      return createAppError(ErrorType.NETWORK, 'NETWORK_TIMEOUT', responseMessage || 'Request Timeout');
    case 500:
    case 502:
    case 503:
      return createAppError(ErrorType.SERVER, 'SERVER_UNAVAILABLE', responseMessage || 'Server Error');
    default:
      return createAppError(ErrorType.UNKNOWN, 'UNKNOWN_ERROR', responseMessage || `HTTP ${status}`);
  }
}

export function parseNetworkError(error: Error): AppError {
  const message = error.message.toLowerCase();
  
  if (message.includes('abort') || message.includes('timeout')) {
    return createAppError(ErrorType.NETWORK, 'NETWORK_TIMEOUT', error.message);
  }
  
  if (message.includes('fetch') || message.includes('network')) {
    return createAppError(ErrorType.NETWORK, 'NETWORK_ERROR', error.message);
  }
  
  if (message.includes('offline')) {
    return createAppError(ErrorType.NETWORK, 'NETWORK_OFFLINE', error.message);
  }
  
  return createAppError(ErrorType.UNKNOWN, 'UNKNOWN_ERROR', error.message);
}

// ========================================
// 錯誤日誌記錄
// ========================================

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: unknown;
}

const errorLogs: LogEntry[] = [];
const MAX_LOG_SIZE = 100;

export function logError(error: AppError): void {
  const entry: LogEntry = {
    level: error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH ? 'error' : 'warn',
    message: `[${error.code}] ${error.message}`,
    timestamp: error.timestamp,
    data: { ...error }
  };
  
  errorLogs.unshift(entry);
  
  // 限制日誌大小
  if (errorLogs.length > MAX_LOG_SIZE) {
    errorLogs.pop();
  }
  
  // 控制台輸出
  if (entry.level === 'error') {
    console.error(`[Wi-Care Error] ${entry.message}`, error.context);
  } else {
    console.warn(`[Wi-Care Warning] ${entry.message}`, error.context);
  }
  
  // 高嚴重性錯誤可發送到遠端服務 (生產環境)
  if (error.severity === ErrorSeverity.CRITICAL) {
    // sendToErrorReportingService(error);
  }
}

export function getErrorLogs(): LogEntry[] {
  return [...errorLogs];
}

export function clearErrorLogs(): void {
  errorLogs.length = 0;
}

// ========================================
// 重試機制
// ========================================

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  shouldRetry?: (error: Error) => boolean;
}

const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || 
           message.includes('network') || 
           message.includes('fetch');
  }
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: Error | null = null;
  let delay = opts.delayMs;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === opts.maxAttempts || !opts.shouldRetry?.(lastError)) {
        throw lastError;
      }
      
      console.log(`[Retry] 嘗試第 ${attempt}/${opts.maxAttempts} 次，${delay}ms 後重試...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= opts.backoffMultiplier;
    }
  }
  
  throw lastError;
}

// ========================================
// 用戶通知
// ========================================

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

type NotificationListener = (notification: Notification) => void;

const notificationListeners: NotificationListener[] = [];

export function subscribeToNotifications(listener: NotificationListener): () => void {
  notificationListeners.push(listener);
  return () => {
    const index = notificationListeners.indexOf(listener);
    if (index > -1) {
      notificationListeners.splice(index, 1);
    }
  };
}

export function notify(notification: Omit<Notification, 'id'>): void {
  const fullNotification: Notification = {
    ...notification,
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    duration: notification.duration ?? 5000,
    dismissible: notification.dismissible ?? true
  };
  
  notificationListeners.forEach(listener => listener(fullNotification));
}

export function notifyError(error: AppError): void {
  notify({
    type: 'error',
    title: '錯誤',
    message: error.userMessage,
    duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 5000
  });
}

export function notifySuccess(message: string, title: string = '成功'): void {
  notify({ type: 'success', title, message });
}

export function notifyWarning(message: string, title: string = '警告'): void {
  notify({ type: 'warning', title, message });
}

export function notifyInfo(message: string, title: string = '提示'): void {
  notify({ type: 'info', title, message });
}
