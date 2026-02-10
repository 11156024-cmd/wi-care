/**
 * Wi-Care LINE Bot 登陸服務
 * 處理 LINE Login 認證流程
 */

// LINE Login 配置
const LINE_LOGIN_CONFIG = {
  // 這些值應該從環境變數中讀取
  CLIENT_ID: process.env.VITE_LINE_CLIENT_ID || 'YOUR_LINE_CLIENT_ID',
  REDIRECT_URI: `${window.location.origin}/auth/line/callback`,
  STATE: 'random_state_' + Math.random().toString(36).substr(2, 9),
  NONCE: 'random_nonce_' + Math.random().toString(36).substr(2, 9),
};

export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineLoginResponse {
  accessToken: string;
  profile: LineUserProfile;
  idToken?: string;
}

/**
 * 取得 LINE Login URL
 */
export function getLineLoginUrl(): string {
  // 為每個登陸請求生成新的 STATE 和 NONCE
  const state = 'state_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const nonce = 'nonce_' + Math.random().toString(36).substr(2, 18);
  
  // 儲存狀態以供回調時驗證
  sessionStorage.setItem('line_login_state', state);
  sessionStorage.setItem('line_login_nonce', nonce);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_LOGIN_CONFIG.CLIENT_ID,
    redirect_uri: LINE_LOGIN_CONFIG.REDIRECT_URI,
    state: state,
    scope: 'profile',
    nonce: nonce,
  });

  return `https://web.line.me/web/login?${params.toString()}`;
}

/**
 * 從授權碼交換 Access Token
 */
export async function exchangeCodeForToken(code: string): Promise<LineLoginResponse> {
  try {
    // 透過後端進行 token 交換（安全做法）
    const response = await fetch('http://localhost:3001/api/auth/line/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Token 交換失敗');
    }

    const data = await response.json();
    
    // 儲存 token 到 localStorage
    if (data.data && data.data.token) {
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return {
      accessToken: data.data.token,
      profile: {
        userId: data.data.user.id,
        displayName: data.data.user.name,
        pictureUrl: data.data.user.pictureUrl,
      },
    };
  } catch (error) {
    console.error('LINE 登陸錯誤:', error);
    throw error;
  }
}

/**
 * 獲取 LINE 用戶個人資料
 */
export async function getLineUserProfile(accessToken: string): Promise<LineUserProfile> {
  try {
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('無法取得用戶資料');
    }

    const profile = await response.json();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  } catch (error) {
    console.error('獲取 LINE 用戶資料失敗:', error);
    throw error;
  }
}

/**
 * LINE 登陸按鈕
 */
export function openLineLoginWindow(): void {
  const loginUrl = getLineLoginUrl();
  // 在新窗口或重定向中開啟登陸
  window.location.href = loginUrl;
}

/**
 * 處理 LINE 登陸回調
 */
export async function handleLineLoginCallback(
  code: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  // 驗證 state 以防止 CSRF 攻擊
  const savedState = sessionStorage.getItem('line_login_state');
  if (state !== savedState) {
    return {
      success: false,
      error: 'State 驗證失敗，可能是 CSRF 攻擊'
    };
  }

  try {
    const response = await exchangeCodeForToken(code);
    
    // 儲存 token 用於後續請求
    localStorage.setItem('line_access_token', response.accessToken);
    if (response.idToken) {
      localStorage.setItem('line_id_token', response.idToken);
    }

    // 清除臨時儲存
    sessionStorage.removeItem('line_login_state');
    sessionStorage.removeItem('line_login_nonce');

    return { success: true };
  } catch (error) {
    console.error('LINE 登陸回調處理失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '登陸失敗'
    };
  }
}

/**
 * 登出 LINE
 */
export function lineLogout(): void {
  localStorage.removeItem('line_access_token');
  localStorage.removeItem('line_id_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('line_login_state');
  sessionStorage.removeItem('line_login_nonce');
}

export default {
  getLineLoginUrl,
  exchangeCodeForToken,
  getLineUserProfile,
  openLineLoginWindow,
  handleLineLoginCallback,
  lineLogout,
};
