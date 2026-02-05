// Wi-Care API 服務
// 連接後端 API 的統一介面

const API_BASE_URL = 'http://localhost:3001/api';

// 儲存 token
let authToken: string | null = null;

// 設定 token
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('wi-care-token', token);
  } else {
    localStorage.removeItem('wi-care-token');
  }
};

// 取得 token
export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('wi-care-token');
  }
  return authToken;
};

// 通用 fetch 函數
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || '請求失敗');
  }
  
  return data;
};

// ========================================
// 認證 API
// ========================================

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
      name: string;
      role: string;
    };
  };
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export const authApi = {
  // 註冊
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },
  
  // 登入
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },
  
  // 登出
  logout: async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('登出失敗:', error);
    } finally {
      setAuthToken(null);
    }
  },
  
  // 驗證 token
  verify: async (): Promise<User | null> => {
    try {
      const response = await apiFetch('/auth/verify');
      return response.data?.user || null;
    } catch (error) {
      setAuthToken(null);
      return null;
    }
  },
};

// ========================================
// 長者資料 API
// ========================================

export interface Elderly {
  id: number;
  name: string;
  age: number;
  room: string;
  status: string;
  lastActivity: string;
}

export const elderlyApi = {
  // 取得所有長者
  getAll: async (): Promise<Elderly[]> => {
    const response = await apiFetch('/elderly');
    return response.data;
  },
  
  // 取得單一長者
  getById: async (id: number): Promise<Elderly> => {
    const response = await apiFetch(`/elderly/${id}`);
    return response.data;
  },
  
  // 更新狀態
  updateStatus: async (id: number, status: string): Promise<Elderly> => {
    const response = await apiFetch(`/elderly/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data;
  },
};

// ========================================
// 事件紀錄 API
// ========================================

export interface Event {
  id: number;
  elderlyId: number;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
}

export const eventsApi = {
  // 取得事件列表
  getAll: async (params?: { elderlyId?: number; type?: string; limit?: number }): Promise<Event[]> => {
    const queryParams = new URLSearchParams();
    if (params?.elderlyId) queryParams.append('elderlyId', params.elderlyId.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    const response = await apiFetch(`/events${query ? `?${query}` : ''}`);
    return response.data;
  },
  
  // 新增事件
  create: async (event: { elderlyId: number; type: string; message: string }): Promise<Event> => {
    const response = await apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return response.data;
  },
};

// ========================================
// 設備管理 API
// ========================================

export interface Device {
  id: string;
  location: string;
  status: 'online' | 'offline';
  lastPing: string;
}

export const devicesApi = {
  // 取得所有設備
  getAll: async (): Promise<Device[]> => {
    const response = await apiFetch('/devices');
    return response.data;
  },
  
  // 取得單一設備
  getById: async (id: string): Promise<Device> => {
    const response = await apiFetch(`/devices/${id}`);
    return response.data;
  },
  
  // 設備心跳
  heartbeat: async (id: string, location?: string): Promise<Device> => {
    const response = await apiFetch(`/devices/${id}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ location }),
    });
    return response.data;
  },
};

// ========================================
// 跌倒偵測 API
// ========================================

export const fallDetectionApi = {
  // 發送跌倒警報
  sendAlert: async (deviceId: string, data?: { csiData?: any; accelerometerData?: any }): Promise<void> => {
    await apiFetch('/fall-detection/alert', {
      method: 'POST',
      body: JSON.stringify({ deviceId, ...data }),
    });
  },
  
  // 清除警報
  clearAlert: async (deviceId: string, clearedBy?: string): Promise<void> => {
    await apiFetch('/fall-detection/clear', {
      method: 'POST',
      body: JSON.stringify({ deviceId, clearedBy }),
    });
  },
  
  // 取得系統狀態
  getStatus: async () => {
    const response = await apiFetch('/fall-detection/status');
    return response.data;
  },
};

// ========================================
// 統計資料 API
// ========================================

export interface DashboardStats {
  totalElderly: number;
  onlineDevices: number;
  todayEvents: number;
  todayFallAlerts: number;
  systemUptime: string;
  lastUpdate: string;
}

export const statsApi = {
  // 取得儀表板統計
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiFetch('/stats/dashboard');
    return response.data;
  },
};

// ========================================
// 健康檢查
// ========================================

export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    return false;
  }
};
