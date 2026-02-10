/**
 * Wi-Care Hooks 索引
 * 集中導出所有自定義 Hooks
 */

// 非同步操作 Hook
export { 
  useAsync, 
  useAsyncCallback, 
  useFetch,
  type AsyncState,
  type AsyncStatus,
  type UseAsyncOptions,
  type UseAsyncReturn,
  type UseFetchOptions,
} from './useAsync';

// 本地儲存 Hook
export { 
  useLocalStorage, 
  useSessionStorage,
  type UseLocalStorageReturn,
} from './useLocalStorage';

// ViewModel Hooks
export { useCaregiverViewModel } from './useCaregiverViewModel';
export { useDeviceSetupViewModel } from './useDeviceSetupViewModel';
export { useElderlyViewModel } from './useElderlyViewModel';
