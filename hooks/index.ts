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
export { useCaregiverViewModel } from './WiCare.useCaregiverViewModel';
export { useDeviceSetupViewModel } from './WiCare.useDeviceSetupViewModel';
export { useElderlyViewModel } from './WiCare.useElderlyViewModel';
