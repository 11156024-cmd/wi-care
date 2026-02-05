/**
 * Wi-Care 表單驗證模組
 * 提供統一的表單驗證規則和錯誤訊息
 */

import { isValidEmail, isValidPhoneNumber, validatePasswordStrength, sanitizeInput } from './security';

// ========================================
// 驗證規則類型定義
// ========================================

export type ValidationRule = {
  validate: (value: unknown) => boolean;
  message: string;
};

export type FieldValidation = {
  rules: ValidationRule[];
  sanitize?: (value: string) => string;
};

export type FormValidation<T extends string> = Record<T, FieldValidation>;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ========================================
// 預定義驗證規則
// ========================================

export const rules = {
  required: (message: string = '此欄位為必填'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return !isNaN(value);
      return value !== null && value !== undefined;
    },
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: message || `至少需要 ${min} 個字元`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length <= max,
    message: message || `最多 ${max} 個字元`
  }),
  
  email: (message: string = '請輸入有效的電子郵件'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && isValidEmail(value),
    message
  }),
  
  phone: (message: string = '請輸入有效的電話號碼'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && (value === '' || isValidPhoneNumber(value)),
    message
  }),
  
  password: (message: string = '密碼強度不足'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && validatePasswordStrength(value).isValid,
    message
  }),
  
  match: (fieldName: string, getValue: () => string, message?: string): ValidationRule => ({
    validate: (value) => value === getValue(),
    message: message || `必須與${fieldName}相符`
  }),
  
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && regex.test(value),
    message
  }),
  
  ipAddress: (message: string = '請輸入有效的 IP 位址'): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      return ipRegex.test(value);
    },
    message
  }),
  
  port: (message: string = '請輸入有效的埠號 (1-65535)'): ValidationRule => ({
    validate: (value) => {
      const num = typeof value === 'string' ? parseInt(value) : value;
      return typeof num === 'number' && num >= 1 && num <= 65535;
    },
    message
  }),
  
  numeric: (message: string = '請輸入數字'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'number') return !isNaN(value);
      if (typeof value === 'string') return !isNaN(Number(value));
      return false;
    },
    message
  }),
  
  date: (message: string = '請輸入有效的日期'): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message
  }),
  
  url: (message: string = '請輸入有效的網址'): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  })
};

// ========================================
// 驗證執行函數
// ========================================

export function validateField(value: unknown, fieldValidation: FieldValidation): string | null {
  for (const rule of fieldValidation.rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

export function validateForm<T extends Record<string, unknown>>(
  data: T,
  schema: Partial<FormValidation<keyof T & string>>
): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [field, validation] of Object.entries(schema)) {
    if (!validation) continue;
    
    let value = data[field as keyof T];
    
    // 如果有消毒函數，先處理值
    if (validation.sanitize && typeof value === 'string') {
      value = validation.sanitize(value) as T[keyof T];
    }
    
    const error = validateField(value, validation);
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ========================================
// 預定義表單驗證 Schema
// ========================================

export const loginFormSchema: FormValidation<'username' | 'password'> = {
  username: {
    rules: [
      rules.required('請輸入帳號'),
      rules.minLength(4, '帳號至少需要 4 個字元')
    ],
    sanitize: sanitizeInput
  },
  password: {
    rules: [
      rules.required('請輸入密碼'),
      rules.minLength(6, '密碼至少需要 6 個字元')
    ]
  }
};

export const registerFormSchema: FormValidation<'username' | 'password' | 'confirmPassword' | 'name' | 'email' | 'phone'> = {
  username: {
    rules: [
      rules.required('請輸入帳號'),
      rules.minLength(4, '帳號至少需要 4 個字元'),
      rules.maxLength(20, '帳號最多 20 個字元'),
      rules.pattern(/^[a-zA-Z0-9_]+$/, '帳號只能包含英文、數字和底線')
    ],
    sanitize: sanitizeInput
  },
  password: {
    rules: [
      rules.required('請輸入密碼'),
      rules.password('密碼強度不足，請包含英文和數字')
    ]
  },
  confirmPassword: {
    rules: [
      rules.required('請確認密碼')
      // match 規則需要動態傳入 getValue
    ]
  },
  name: {
    rules: [
      rules.required('請輸入姓名'),
      rules.minLength(2, '姓名至少需要 2 個字元'),
      rules.maxLength(50, '姓名最多 50 個字元')
    ],
    sanitize: sanitizeInput
  },
  email: {
    rules: [
      rules.email('請輸入有效的電子郵件')
    ],
    sanitize: (v) => v.trim().toLowerCase()
  },
  phone: {
    rules: [
      rules.phone('請輸入有效的電話號碼')
    ]
  }
};

export const caregiverFormSchema: FormValidation<'name' | 'email' | 'phone' | 'role' | 'shift'> = {
  name: {
    rules: [
      rules.required('請輸入姓名'),
      rules.minLength(2, '姓名至少需要 2 個字元')
    ],
    sanitize: sanitizeInput
  },
  email: {
    rules: [
      rules.required('請輸入電子郵件'),
      rules.email('請輸入有效的電子郵件')
    ]
  },
  phone: {
    rules: [
      rules.required('請輸入電話號碼'),
      rules.phone('請輸入有效的電話號碼')
    ]
  },
  role: {
    rules: [rules.required('請選擇角色')]
  },
  shift: {
    rules: [rules.required('請選擇班別')]
  }
};

export const deviceFormSchema: FormValidation<'name' | 'type' | 'location' | 'ip'> = {
  name: {
    rules: [
      rules.required('請輸入設備名稱'),
      rules.minLength(2, '設備名稱至少需要 2 個字元')
    ],
    sanitize: sanitizeInput
  },
  type: {
    rules: [rules.required('請選擇設備類型')]
  },
  location: {
    rules: [rules.required('請選擇安裝位置')]
  },
  ip: {
    rules: [
      // IP 可選，但如果填寫則必須符合格式
    ]
  }
};

export const esp32SettingsSchema: FormValidation<'ip' | 'port'> = {
  ip: {
    rules: [
      rules.required('請輸入 IP 位址'),
      rules.ipAddress('請輸入有效的 IP 位址')
    ]
  },
  port: {
    rules: [
      rules.required('請輸入埠號'),
      rules.port('請輸入有效的埠號 (1-65535)')
    ]
  }
};
