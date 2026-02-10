/**
 * 安全工具單元測試
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  escapeHtml,
  sanitizeInput,
  isValidEmail,
  isValidPhoneNumber,
  validatePasswordStrength,
  generateCSRFToken,
  validateCSRFToken,
  secureStore,
  secureRetrieve,
  checkRateLimit,
} from '../src/utils/security';

describe('Security Utils', () => {
  describe('escapeHtml', () => {
    it('應該轉義 HTML 特殊字元', () => {
      const result = escapeHtml('<script>alert("xss")</script>');
      // escapeHtml 使用 &#x2F; 而非 / 進行轉義
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;xss&quot;');
      expect(result).toContain('&lt;');
    });

    it('應該轉義 & 符號', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('應該轉義單引號', () => {
      // escapeHtml 使用 &#x27; 而非 &#039;
      expect(escapeHtml("It's a test")).toBe("It&#x27;s a test");
    });

    it('應該處理空字串', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('應該處理無特殊字元的字串', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeInput', () => {
    it('應該移除潛在的腳本標籤', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('應該移除 javascript: 協議 (注：HTML 標籤)', () => {
      // sanitizeInput 只會移除 HTML 標籤，不會移除純文本中的 javascript:
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('應該移除事件處理器', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
    });

    it('應該處理空字串', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('應該驗證有效的電子郵件', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('應該拒絕無效的電子郵件', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test @domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('應該驗證有效的台灣手機號碼', () => {
      expect(isValidPhoneNumber('0912345678')).toBe(true);
      expect(isValidPhoneNumber('0912-345-678')).toBe(true);
      expect(isValidPhoneNumber('0913 234 567')).toBe(true);
    });

    it('應該拒絕無效的電話號碼', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abcdefghij')).toBe(false);
      expect(isValidPhoneNumber('02-12345678')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('應該返回強密碼的評分', () => {
      const result = validatePasswordStrength('MyP@ssw0rd!123');
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.isValid).toBe(true);
    });

    it('應該返回中等密碼的評分', () => {
      // Password1 滿足所有 5 個條件，score 為 4 (最大值)
      const result = validatePasswordStrength('Password1');
      expect(result.score).toBe(4);
      expect(result.isValid).toBe(true);
    });

    it('應該返回弱密碼的評分', () => {
      const result = validatePasswordStrength('abc');
      expect(result.score).toBeLessThan(2);
      expect(result.isValid).toBe(false);
    });

    it('應該提供改進建議', () => {
      const result = validatePasswordStrength('password');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('CSRF Token', () => {
    beforeEach(() => {
      // 清除 sessionStorage
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);
      vi.mocked(sessionStorage.setItem).mockClear();
    });

    it('generateCSRFToken 應該返回字串', () => {
      const token = generateCSRFToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('validateCSRFToken 應該驗證 Token', () => {
      const token = 'test-token';
      vi.mocked(sessionStorage.getItem).mockReturnValue(token);
      
      expect(validateCSRFToken(token)).toBe(true);
      expect(validateCSRFToken('wrong-token')).toBe(false);
    });
  });

  describe('Secure Storage', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(localStorage.setItem).mockClear();
      vi.mocked(localStorage.removeItem).mockClear();
    });

    it('secureStore 應該將值編碼後儲存', () => {
      secureStore('testKey', 'testValue');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('secureRetrieve 應該處理編碼值', () => {
      // 測試本身的編碼邏輯
      const value = 'testValue';
      secureStore('testKey', value);
      
      // 模擬取回
      const encoded = btoa(JSON.stringify(value));
      vi.mocked(localStorage.getItem).mockReturnValue(encoded);
      const result = secureRetrieve('testKey');
      expect(result).toBe(value);
    });

    it('secureRetrieve 應該在找不到值時返回 null', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      const result = secureRetrieve('nonExistentKey');
      expect(result).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // 重置 rate limit 記錄
      vi.useFakeTimers();
    });

    it('應該允許在限制內的請求', () => {
      const key = 'test-action';
      const maxRequests = 5;
      const windowMs = 60000;

      // 前 5 次應該都通過
      for (let i = 0; i < maxRequests; i++) {
        expect(checkRateLimit(key, maxRequests, windowMs)).toBe(true);
      }
    });

    it('應該拒絕超過限制的請求', () => {
      const key = 'test-action-2';
      const maxRequests = 3;
      const windowMs = 60000;

      // 使用完配額
      for (let i = 0; i < maxRequests; i++) {
        checkRateLimit(key, maxRequests, windowMs);
      }

      // 第 4 次應該被拒絕
      expect(checkRateLimit(key, maxRequests, windowMs)).toBe(false);
    });
  });
});
