import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ========================================
// 模擬資料庫 (實際應用應使用真實資料庫)
// ========================================

// 使用者資料
const users = [
  { id: 1, username: 'admin', password: 'admin123', name: '系統管理員', role: 'admin' },
  { id: 2, username: 'nurse1', password: 'nurse123', name: '王小明', role: 'nurse' },
  { id: 3, username: 'nurse2', password: 'nurse123', name: '李小華', role: 'nurse' },
];

// 長者資料
const elderly = [
  { id: 1, name: '陳阿嬤', age: 78, room: 'A101', status: 'safe', lastActivity: '2026-01-16T13:30:00' },
  { id: 2, name: '林阿公', age: 82, room: 'A102', status: 'safe', lastActivity: '2026-01-16T13:25:00' },
  { id: 3, name: '張阿嬤', age: 75, room: 'B201', status: 'safe', lastActivity: '2026-01-16T13:20:00' },
];

// 事件紀錄
const eventLogs = [
  { id: 1, elderlyId: 1, type: 'activity', message: '正常活動', timestamp: '2026-01-16T13:30:00' },
  { id: 2, elderlyId: 2, type: 'activity', message: '起床活動', timestamp: '2026-01-16T13:25:00' },
  { id: 3, elderlyId: 1, type: 'fall_alert', message: '跌倒警報 (已解除)', timestamp: '2026-01-16T10:15:00' },
];

// 設備狀態
const devices = [
  { id: 'Wi-Care-Station-01', location: 'A101 浴室', status: 'online', lastPing: new Date().toISOString() },
  { id: 'Wi-Care-Station-02', location: 'A102 浴室', status: 'online', lastPing: new Date().toISOString() },
  { id: 'Wi-Care-Station-03', location: 'B201 浴室', status: 'offline', lastPing: '2026-01-16T12:00:00' },
];

// Session 儲存 (簡易版，實際應用應使用 JWT 或 session store)
const sessions = new Map();

// ========================================
// API 路由
// ========================================

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Wi-Care 後端服務運行中',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// 認證 API
// ========================================

// 註冊
app.post('/api/auth/register', (req, res) => {
  const { username, password, name, role = 'nurse', phone, email } = req.body;
  
  // 驗證必填欄位
  if (!username || !password || !name) {
    return res.status(400).json({ 
      success: false, 
      message: '請填寫所有必填欄位（帳號、密碼、姓名）' 
    });
  }
  
  // 檢查帳號長度
  if (username.length < 4) {
    return res.status(400).json({ 
      success: false, 
      message: '帳號至少需要 4 個字元' 
    });
  }
  
  // 檢查密碼長度
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: '密碼至少需要 6 個字元' 
    });
  }
  
  // 檢查帳號是否已存在
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ 
      success: false, 
      message: '此帳號已被使用' 
    });
  }
  
  // 建立新使用者
  const newUser = {
    id: users.length + 1,
    username,
    password,
    name,
    role,
    phone: phone || '',
    email: email || '',
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  console.log(`[註冊] 新使用者: ${username} (${name})`);
  
  // 自動登入
  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessions.set(token, { userId: newUser.id, createdAt: new Date() });
  
  res.status(201).json({
    success: true,
    message: '註冊成功',
    data: {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    }
  });
});

// 登入
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: '請提供帳號和密碼' 
    });
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: '帳號或密碼錯誤' 
    });
  }
  
  // 產生 session token (簡易版)
  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessions.set(token, { userId: user.id, createdAt: new Date() });
  
  res.json({
    success: true,
    message: '登入成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    }
  });
});

// 登出
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && sessions.has(token)) {
    sessions.delete(token);
  }
  
  res.json({ success: true, message: '已登出' });
});

// 驗證 token
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ success: false, message: '未授權' });
  }
  
  const session = sessions.get(token);
  const user = users.find(u => u.id === session.userId);
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    }
  });
});

// LINE 登陸 - 令牌交換
app.post('/api/auth/line/token', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: '缺少授權碼'
    });
  }

  try {
    // 在實際應用中，這裡應該調用 LINE 的令牌端點
    // 為了演示，我們模擬令牌交換過程
    
    const lineAccessToken = `line_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lineRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 獲取 LINE 用戶信息 (在實際應用中應調用 LINE API)
    const lineUserProfile = {
      userId: `U${Math.random().toString(36).substr(2, 18)}`,
      displayName: 'LINE 用戶',
      pictureUrl: 'https://example.com/picture.jpg'
    };

    // 檢查使用者是否已存在 (基於 LINE userId)
    let user = users.find(u => u.lineUserId === lineUserProfile.userId);

    if (!user) {
      // 創建新的 LINE 使用者帳號
      user = {
        id: users.length + 1,
        username: `line_${lineUserProfile.userId.substring(0, 10)}`,
        password: 'oauth_no_password',
        name: lineUserProfile.displayName,
        role: 'nurse',
        lineUserId: lineUserProfile.userId,
        lineAccessToken,
        lineRefreshToken,
        pictureUrl: lineUserProfile.pictureUrl,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      console.log(`[LINE 登陸] 新用戶: ${user.name} (${lineUserProfile.userId})`);
    } else {
      // 更新現有使用者的 LINE tokens
      user.lineAccessToken = lineAccessToken;
      user.lineRefreshToken = lineRefreshToken;
      user.pictureUrl = lineUserProfile.pictureUrl;
      console.log(`[LINE 登陸] 用戶登入: ${user.name}`);
    }

    // 產生應用程式 session token
    const appToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessions.set(appToken, { userId: user.id, loginMethod: 'line', createdAt: new Date() });

    res.json({
      success: true,
      message: 'LINE 登陸成功',
      data: {
        token: appToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          pictureUrl: user.pictureUrl
        }
      }
    });
  } catch (error) {
    console.error('LINE 令牌交換錯誤:', error);
    res.status(500).json({
      success: false,
      message: 'LINE 登陸失敗，請重試'
    });
  }
});

// LINE 登陸 - 獲取登陸 URL
app.get('/api/auth/line/login-url', (req, res) => {
  const lineClientId = process.env.LINE_CLIENT_ID || 'your_line_client_id';
  const redirectUri = process.env.LINE_REDIRECT_URI || 'http://localhost:3000/auth/line/callback';
  const state = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const nonce = `nonce_${Math.random().toString(36).substr(2, 18)}`;

  // 存儲 state 和 nonce 供後續驗證
  sessions.set(`line_state_${state}`, { nonce, createdAt: Date.now() });

  const lineLoginUrl = `https://web.line.biz/dialog/oauth/weblogin?response_type=code&client_id=${lineClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&nonce=${nonce}&scope=openid%20profile`;

  res.json({
    success: true,
    loginUrl: lineLoginUrl
  });
});

// ========================================
// 長者資料 API
// ========================================

// 取得所有長者
app.get('/api/elderly', (req, res) => {
  res.json({
    success: true,
    data: elderly
  });
});

// 取得單一長者
app.get('/api/elderly/:id', (req, res) => {
  const elder = elderly.find(e => e.id === parseInt(req.params.id));
  
  if (!elder) {
    return res.status(404).json({ success: false, message: '找不到此長者' });
  }
  
  res.json({ success: true, data: elder });
});

// 更新長者狀態
app.patch('/api/elderly/:id/status', (req, res) => {
  const { status } = req.body;
  const elder = elderly.find(e => e.id === parseInt(req.params.id));
  
  if (!elder) {
    return res.status(404).json({ success: false, message: '找不到此長者' });
  }
  
  elder.status = status;
  elder.lastActivity = new Date().toISOString();
  
  res.json({ success: true, data: elder });
});

// ========================================
// 事件紀錄 API
// ========================================

// 取得事件紀錄
app.get('/api/events', (req, res) => {
  const { elderlyId, type, limit = 50 } = req.query;
  
  let filteredEvents = [...eventLogs];
  
  if (elderlyId) {
    filteredEvents = filteredEvents.filter(e => e.elderlyId === parseInt(elderlyId));
  }
  
  if (type) {
    filteredEvents = filteredEvents.filter(e => e.type === type);
  }
  
  // 按時間倒序
  filteredEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({
    success: true,
    data: filteredEvents.slice(0, parseInt(limit))
  });
});

// 新增事件
app.post('/api/events', (req, res) => {
  const { elderlyId, type, message } = req.body;
  
  const newEvent = {
    id: eventLogs.length + 1,
    elderlyId,
    type,
    message,
    timestamp: new Date().toISOString()
  };
  
  eventLogs.push(newEvent);
  
  res.status(201).json({ success: true, data: newEvent });
});

// ========================================
// 設備管理 API
// ========================================

// 取得所有設備
app.get('/api/devices', (req, res) => {
  res.json({ success: true, data: devices });
});

// 取得單一設備
app.get('/api/devices/:id', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  
  if (!device) {
    return res.status(404).json({ success: false, message: '找不到此設備' });
  }
  
  res.json({ success: true, data: device });
});

// 更新設備狀態 (ESP32 心跳)
app.post('/api/devices/:id/heartbeat', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  
  if (!device) {
    // 如果是新設備，自動註冊
    const newDevice = {
      id: req.params.id,
      location: req.body.location || '未指定位置',
      status: 'online',
      lastPing: new Date().toISOString()
    };
    devices.push(newDevice);
    return res.status(201).json({ success: true, data: newDevice });
  }
  
  device.status = 'online';
  device.lastPing = new Date().toISOString();
  
  res.json({ success: true, data: device });
});

// ========================================
// 跌倒偵測 API
// ========================================

// 接收跌倒警報 (來自 ESP32)
app.post('/api/fall-detection/alert', (req, res) => {
  const { deviceId, csiData, accelerometerData } = req.body;
  
  console.log(`[ALERT] 收到跌倒警報 from ${deviceId}`);
  console.log(`  CSI 數據: ${JSON.stringify(csiData)}`);
  console.log(`  加速度計: ${JSON.stringify(accelerometerData)}`);
  
  // 找到對應的設備和長者
  const device = devices.find(d => d.id === deviceId);
  
  // 記錄事件
  const newEvent = {
    id: eventLogs.length + 1,
    elderlyId: 1, // 實際應用應根據設備位置對應長者
    type: 'fall_alert',
    message: `跌倒警報 - 設備: ${deviceId}`,
    timestamp: new Date().toISOString(),
    data: { csiData, accelerometerData }
  };
  eventLogs.push(newEvent);
  
  // TODO: 這裡可以加入：
  // 1. 發送 LINE 通知
  // 2. 發送推播通知
  // 3. 觸發警報聲
  // 4. 通知護理站
  
  res.json({ 
    success: true, 
    message: '警報已接收並處理',
    eventId: newEvent.id
  });
});

// 清除跌倒警報
app.post('/api/fall-detection/clear', (req, res) => {
  const { deviceId, clearedBy } = req.body;
  
  console.log(`[CLEAR] 警報已清除 - 設備: ${deviceId}, 操作者: ${clearedBy || 'unknown'}`);
  
  // 記錄清除事件
  const newEvent = {
    id: eventLogs.length + 1,
    elderlyId: 1,
    type: 'alert_cleared',
    message: `警報已清除 - 操作者: ${clearedBy || '系統'}`,
    timestamp: new Date().toISOString()
  };
  eventLogs.push(newEvent);
  
  res.json({ success: true, message: '警報已清除' });
});

// 取得目前系統狀態
app.get('/api/fall-detection/status', (req, res) => {
  // 檢查是否有未處理的跌倒警報
  const activeAlerts = eventLogs.filter(e => 
    e.type === 'fall_alert' && 
    !eventLogs.some(ce => 
      ce.type === 'alert_cleared' && 
      new Date(ce.timestamp) > new Date(e.timestamp)
    )
  );
  
  res.json({
    success: true,
    data: {
      hasActiveAlert: activeAlerts.length > 0,
      activeAlerts,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      totalDevices: devices.length
    }
  });
});

// ========================================
// 統計資料 API
// ========================================

app.get('/api/stats/dashboard', (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const todayEvents = eventLogs.filter(e => new Date(e.timestamp) >= todayStart);
  const fallAlerts = todayEvents.filter(e => e.type === 'fall_alert');
  
  res.json({
    success: true,
    data: {
      totalElderly: elderly.length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      todayEvents: todayEvents.length,
      todayFallAlerts: fallAlerts.length,
      systemUptime: '99.9%',
      lastUpdate: new Date().toISOString()
    }
  });
});

// ========================================
// 啟動伺服器
// ========================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║   🏥 Wi-Care 後端服務已啟動                               ║');
  console.log('║                                                          ║');
  console.log(`║   📡 API 網址: http://localhost:${PORT}                      ║`);
  console.log('║                                                          ║');
  console.log('║   可用的 API:                                            ║');
  console.log('║   • GET  /api/health          - 健康檢查                 ║');
  console.log('║   • POST /api/auth/login      - 登入                     ║');
  console.log('║   • POST /api/auth/logout     - 登出                     ║');
  console.log('║   • GET  /api/elderly         - 取得長者列表             ║');
  console.log('║   • GET  /api/devices         - 取得設備列表             ║');
  console.log('║   • GET  /api/events          - 取得事件紀錄             ║');
  console.log('║   • POST /api/fall-detection/alert - 跌倒警報            ║');
  console.log('║   • GET  /api/stats/dashboard - 儀表板統計               ║');
  console.log('║                                                          ║');
  console.log('║   測試帳號:                                              ║');
  console.log('║   • admin / admin123 (管理員)                            ║');
  console.log('║   • nurse1 / nurse123 (護理師)                           ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});
