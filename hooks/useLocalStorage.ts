/**
 * useLocalStorage Hook
 * 管理 localStorage 的 React Hook
 */

import { useState, useCallback, useEffect } from 'react';

// ========================================
// 型別定義
// ========================================

type SetValue<T> = T | ((prevValue: T) => T);

export interface UseLocalStorageReturn<T> {
  /** 儲存的值 */
  value: T;
  /** 設定值 */
  setValue: (value: SetValue<T>) => void;
  /** 移除值 */
  removeValue: () => void;
  /** 錯誤 */
  error: Error | null;
}

// ========================================
// 工具函數
// ========================================

/**
 * 安全地解析 JSON
 */
function parseJSON<T>(value: string | null, fallback: T): T {
  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * 安全地序列化為 JSON
 */
function serializeJSON<T>(value: T): string {
  try {
    return JSON.stringify(value);
  } catch {
    throw new Error('Failed to serialize value to JSON');
  }
}

// ========================================
// useLocalStorage Hook 實作
// ========================================

/**
 * 管理 localStorage 的 Hook
 * 
 * @param key - localStorage 的鍵名
 * @param initialValue - 初始值
 * @returns 值與操作函數
 * 
 * @example
 * ```tsx
 * const { value, setValue, removeValue } = useLocalStorage('user', { name: '' });
 * 
 * // 設定值
 * setValue({ name: 'John' });
 * 
 * // 使用函數更新
 * setValue(prev => ({ ...prev, age: 30 }));
 * 
 * // 移除值
 * removeValue();
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  const [error, setError] = useState<Error | null>(null);

  // 讀取初始值
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return parseJSON(item, initialValue);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to read from localStorage'));
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 設定值
  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === 'undefined') {
        console.warn(`Tried to set localStorage key "${key}" during SSR`);
        return;
      }

      try {
        // 允許傳入函數來更新值
        const newValue = value instanceof Function ? value(storedValue) : value;
        
        // 儲存到 localStorage
        window.localStorage.setItem(key, serializeJSON(newValue));
        
        // 更新 state
        setStoredValue(newValue);
        setError(null);

        // 觸發其他視窗的同步
        window.dispatchEvent(new StorageEvent('local-storage', { key }));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to write to localStorage'));
      }
    },
    [key, storedValue]
  );

  // 移除值
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      setError(null);
      window.dispatchEvent(new StorageEvent('local-storage', { key }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove from localStorage'));
    }
  }, [initialValue, key]);

  // 監聽其他視窗/分頁的變更
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key || (event as { key?: string }).key === key) {
        setStoredValue(readValue());
      }
    };

    // 監聽 storage 事件 (跨視窗)
    window.addEventListener('storage', handleStorageChange);
    // 監聯自定義事件 (同視窗)
    window.addEventListener('local-storage', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange as EventListener);
    };
  }, [key, readValue]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    error,
  };
}

// ========================================
// useSessionStorage Hook
// ========================================

/**
 * 管理 sessionStorage 的 Hook
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  const [error, setError] = useState<Error | null>(null);

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return parseJSON(item, initialValue);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to read from sessionStorage'));
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.sessionStorage.setItem(key, serializeJSON(newValue));
        setStoredValue(newValue);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to write to sessionStorage'));
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove from sessionStorage'));
    }
  }, [initialValue, key]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    error,
  };
}

export default useLocalStorage;
