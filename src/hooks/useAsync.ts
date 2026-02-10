/**
 * useAsync Hook
 * 處理非同步操作的統一 Hook
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ========================================
// 型別定義
// ========================================

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  /** 資料 */
  data: T | null;
  /** 錯誤訊息 */
  error: Error | null;
  /** 狀態 */
  status: AsyncStatus;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 是否成功 */
  isSuccess: boolean;
  /** 是否失敗 */
  isError: boolean;
  /** 是否閒置 */
  isIdle: boolean;
}

export interface UseAsyncOptions<T> {
  /** 初始資料 */
  initialData?: T | null;
  /** 成功回調 */
  onSuccess?: (data: T) => void;
  /** 失敗回調 */
  onError?: (error: Error) => void;
  /** 重試次數 */
  retryCount?: number;
  /** 重試延遲 (毫秒) */
  retryDelay?: number;
}

export interface UseAsyncReturn<T, Args extends unknown[] = unknown[]> extends AsyncState<T> {
  /** 執行非同步操作 */
  execute: (...args: Args) => Promise<T | null>;
  /** 重置狀態 */
  reset: () => void;
  /** 設定資料 */
  setData: (data: T | null) => void;
}

// ========================================
// useAsync Hook 實作
// ========================================

/**
 * 處理非同步操作的通用 Hook
 * 
 * @param asyncFunction - 非同步函數
 * @param options - 選項設定
 * @returns 非同步狀態與控制函數
 * 
 * @example
 * ```tsx
 * const { data, isLoading, execute } = useAsync(fetchUser);
 * 
 * useEffect(() => {
 *   execute(userId);
 * }, [userId]);
 * ```
 */
export function useAsync<T, Args extends unknown[] = unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const {
    initialData = null,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    status: 'idle',
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
  });

  // 追蹤組件是否已卸載
  const mountedRef = useRef(true);
  
  // 追蹤當前請求
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setData = useCallback((data: T | null) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, data }));
    }
  }, []);

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setState({
        data: initialData,
        error: null,
        status: 'idle',
        isLoading: false,
        isSuccess: false,
        isError: false,
        isIdle: true,
      });
    }
  }, [initialData]);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      const currentRequestId = ++requestIdRef.current;

      setState({
        data: state.data, // 保留舊資料
        error: null,
        status: 'loading',
        isLoading: true,
        isSuccess: false,
        isError: false,
        isIdle: false,
      });

      let lastError: Error | null = null;
      let attempts = 0;
      const maxAttempts = retryCount + 1;

      while (attempts < maxAttempts) {
        try {
          const result = await asyncFunction(...args);

          // 檢查這是否仍是最新的請求
          if (requestIdRef.current !== currentRequestId || !mountedRef.current) {
            return null;
          }

          setState({
            data: result,
            error: null,
            status: 'success',
            isLoading: false,
            isSuccess: true,
            isError: false,
            isIdle: false,
          });

          onSuccess?.(result);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          attempts++;

          // 如果還有重試機會，等待後重試
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      // 所有重試都失敗
      if (requestIdRef.current === currentRequestId && mountedRef.current) {
        setState({
          data: null,
          error: lastError,
          status: 'error',
          isLoading: false,
          isSuccess: false,
          isError: true,
          isIdle: false,
        });

        onError?.(lastError!);
      }

      return null;
    },
    [asyncFunction, onSuccess, onError, retryCount, retryDelay, state.data]
  );

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

// ========================================
// useAsyncCallback Hook
// ========================================

/**
 * 當需要傳遞依賴項時使用的版本
 */
export function useAsyncCallback<T, Args extends unknown[] = unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  deps: React.DependencyList,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedFn = useCallback(asyncFunction, deps);
  return useAsync(memoizedFn, options);
}

// ========================================
// useFetch Hook
// ========================================

export interface UseFetchOptions<T> extends UseAsyncOptions<T> {
  /** 是否立即執行 */
  immediate?: boolean;
  /** 依賴項變更時重新執行 */
  refreshDeps?: unknown[];
}

/**
 * 專為 fetch 請求設計的 Hook
 */
export function useFetch<T>(
  url: string,
  fetchOptions?: RequestInit,
  options: UseFetchOptions<T> = {}
): UseAsyncReturn<T, []> {
  const { immediate = true, refreshDeps = [], ...asyncOptions } = options;

  const fetchFn = useCallback(async (): Promise<T> => {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }, [url, fetchOptions]);

  const asyncResult = useAsync(fetchFn, asyncOptions);

  useEffect(() => {
    if (immediate) {
      asyncResult.execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...refreshDeps]);

  return asyncResult;
}

export default useAsync;
