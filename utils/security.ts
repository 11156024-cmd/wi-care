/**
 * Wi-Care 安全工具模組
 * 提供密碼雜湊、Token 安全生成、輸入消毒等功能
 */

// ========================================
// 密碼安全處理
// ========================================

/**
 * 使用 Web Crypto API 進行密碼雜湊 (前端用於註冊/登入前的預處理)
 * 注意：真正的密碼雜湊應在後端使用 bcrypt/argon2 進行
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成安全的隨機 Token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ========================================
// 輸入消毒與驗證
// ========================================

/**
 * HTML 特殊字元轉義，防止 XSS 攻擊
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, char => htmlEntities[char]);
}

/**
 * 移除危險的 HTML 標籤
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * 驗證電子郵件格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 驗證電話號碼格式 (台灣格式)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // 支援格式: 0912345678, 09-12345678, 0912-345-678
  const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 密碼強度驗證
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  message: string;
  suggestions: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score++;
  } else {
    suggestions.push('密碼長度至少需要 8 個字元');
  }
  
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    suggestions.push('建議包含小寫字母');
  }
  
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('建議包含大寫字母');
  }
  
  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('建議包含數字');
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    suggestions.push('建議包含特殊符號');
  }
  
  const messages = ['非常弱', '弱', '普通', '強', '非常強'];
  
  return {
    isValid: password.length >= 6 && score >= 2,
    score: Math.min(score, 4),
    message: messages[Math.min(score, 4)],
    suggestions
  };
}

// ========================================
// CSRF 防護
// ========================================

/**
 * 生成 CSRF Token
 */
export function generateCSRFToken(): string {
  const token = generateSecureToken(32);
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * 驗證 CSRF Token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token && token.length > 0;
}

// ========================================
// 安全的 LocalStorage 操作
// ========================================

/**
 * 安全存儲敏感資料 (使用 Base64 編碼，生產環境應考慮加密)
 */
export function secureStore(key: string, value: unknown): void {
  try {
    const encoded = btoa(JSON.stringify(value));
    localStorage.setItem(key, encoded);
  } catch (error) {
    console.error('安全存儲失敗:', error);
  }
}

/**
 * 安全讀取敏感資料
 */
export function secureRetrieve<T>(key: string): T | null {
  try {
    const encoded = localStorage.getItem(key);
    if (!encoded) return null;
    return JSON.parse(atob(encoded)) as T;
  } catch (error) {
    console.error('安全讀取失敗:', error);
    return null;
  }
}

// ========================================
// 速率限制 (客戶端)
// ========================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * 檢查是否超過速率限制
 */
export function checkRateLimit(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(action);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(action, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * 重置速率限制
 */
export function resetRateLimit(action: string): void {
  rateLimitMap.delete(action);
}
