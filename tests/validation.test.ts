/**
 * 驗證工具單元測試
 */

import { describe, it, expect } from 'vitest';
import {
  rules,
  validateField,
  validateForm,
  FieldValidation,
} from '../src/utils/validation';

describe('Validation Rules', () => {
  describe('required', () => {
    it('應該在值為空時返回 false', () => {
      const rule = rules.required();
      expect(rule.validate('')).toBe(false);
      expect(rule.validate('   ')).toBe(false);
    });

    it('應該在值存在時返回 true', () => {
      const rule = rules.required();
      expect(rule.validate('test')).toBe(true);
      expect(rule.validate('123')).toBe(true);
    });
  });

  describe('minLength', () => {
    it('應該在長度不足時返回 false', () => {
      const minLength5 = rules.minLength(5);
      expect(minLength5.validate('abc')).toBe(false);
      expect(minLength5.validate('ab')).toBe(false);
    });

    it('應該在長度足夠時返回 true', () => {
      const minLength5 = rules.minLength(5);
      expect(minLength5.validate('abcde')).toBe(true);
      expect(minLength5.validate('abcdefgh')).toBe(true);
    });
  });

  describe('maxLength', () => {
    it('應該在長度超過時返回 false', () => {
      const maxLength5 = rules.maxLength(5);
      expect(maxLength5.validate('abcdef')).toBe(false);
    });

    it('應該在長度未超過時返回 true', () => {
      const maxLength5 = rules.maxLength(5);
      expect(maxLength5.validate('abc')).toBe(true);
      expect(maxLength5.validate('abcde')).toBe(true);
    });
  });

  describe('email', () => {
    it('應該驗證有效的電子郵件', () => {
      const rule = rules.email();
      expect(rule.validate('test@example.com')).toBe(true);
      expect(rule.validate('user.name@domain.org')).toBe(true);
    });

    it('應該拒絕無效的電子郵件', () => {
      const rule = rules.email();
      expect(rule.validate('invalid')).toBe(false);
      expect(rule.validate('test@')).toBe(false);
      expect(rule.validate('@domain.com')).toBe(false);
    });
  });

  describe('phone', () => {
    it('應該驗證有效的台灣電話號碼', () => {
      const rule = rules.phone();
      expect(rule.validate('0912345678')).toBe(true);
      expect(rule.validate('0912-345-678')).toBe(true);
      expect(rule.validate('')).toBe(true); // 電話為選填
    });

    it('應該拒絕無效的電話號碼', () => {
      const rule = rules.phone();
      expect(rule.validate('123')).toBe(false);
      expect(rule.validate('abcdefghij')).toBe(false);
      expect(rule.validate('02-12345678')).toBe(false); // 市話格式不支援
    });
  });

  describe('password', () => {
    it('應該驗證符合規則的密碼', () => {
      const rule = rules.password();
      expect(rule.validate('Abcd1234!')).toBe(true);
      expect(rule.validate('Password123!')).toBe(true);
      expect(rule.validate('password')).toBe(true); // 長度 8+ 且至少兩項條件滿足
    });

    it('應該拒絕密碼強度不足', () => {
      const rule = rules.password();
      expect(rule.validate('abc')).toBe(false);
      expect(rule.validate('Ab')).toBe(false); // 長度不足 8
    });
  });

  describe('pattern', () => {
    it('應該使用 RegExp 驗證', () => {
      const rule = rules.pattern(/^\d{3}-\d{4}$/, '格式應為 XXX-XXXX');
      expect(rule.validate('123-4567')).toBe(true);
      expect(rule.validate('1234567')).toBe(false);
    });
  });

  describe('ipAddress', () => {
    it('應該驗證有效的 IP 地址', () => {
      const rule = rules.ipAddress();
      expect(rule.validate('192.168.1.1')).toBe(true);
      expect(rule.validate('10.0.0.1')).toBe(true);
      expect(rule.validate('255.255.255.255')).toBe(true);
    });

    it('應該拒絕無效的 IP 地址', () => {
      const rule = rules.ipAddress();
      expect(rule.validate('256.1.1.1')).toBe(false);
      expect(rule.validate('192.168.1')).toBe(false);
      expect(rule.validate('not.an.ip.address')).toBe(false);
    });
  });

  describe('port', () => {
    it('應該驗證有效的連接埠', () => {
      const rule = rules.port();
      expect(rule.validate('80')).toBe(true);
      expect(rule.validate('8080')).toBe(true);
      expect(rule.validate('443')).toBe(true);
      expect(rule.validate('65535')).toBe(true);
    });

    it('應該拒絕無效的連接埠', () => {
      const rule = rules.port();
      expect(rule.validate('0')).toBe(false);
      expect(rule.validate('65536')).toBe(false);
      expect(rule.validate('abc')).toBe(false);
    });
  });

  describe('numeric', () => {
    it('應該驗證數字', () => {
      const rule = rules.numeric();
      expect(rule.validate('123')).toBe(true);
      expect(rule.validate(456)).toBe(true);
      expect(rule.validate('abc')).toBe(false);
    });
  });
});

describe('validateField', () => {
  it('應該執行所有規則並返回第一個錯誤', () => {
    const fieldValidation: FieldValidation = {
      rules: [rules.required(), rules.email()],
    };
    
    expect(validateField('', fieldValidation)).toBe('此欄位為必填');
    expect(validateField('invalid', fieldValidation)).toBe('請輸入有效的電子郵件');
    // validateField 在驗證成功時返回 null (不是 undefined)
    expect(validateField('test@example.com', fieldValidation)).toBeNull();
  });
});

describe('validateForm', () => {
  it('應該驗證整個表單並返回所有錯誤', () => {
    const schema = {
      email: { rules: [rules.required(), rules.email()] },
      password: { rules: [rules.required(), rules.minLength(8)] },
    };

    const invalidData = { email: 'invalid', password: '123' };
    const result = validateForm(invalidData, schema);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('請輸入有效的電子郵件');
    expect(result.errors.password).toBe('至少需要 8 個字元');
  });

  it('應該在所有欄位有效時返回 isValid: true', () => {
    const schema = {
      email: { rules: [rules.required(), rules.email()] },
      password: { rules: [rules.required(), rules.minLength(8)] },
    };

    const validData = { email: 'test@example.com', password: 'password123' };
    const result = validateForm(validData, schema);

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });
});
