/**
 * Wi-Care 後端伺服器 v2.0
 * 
 * 升級內容：
 * - SQLite 持久化資料庫 (取代 in-memory)
 * - bcrypt 密碼雜湊 (取代明文)
 * - JWT 認證 (取代隨機字串 token)
 * - WebSocket 即時推送 (取代前端輪詢)
 * - LINE Messaging API 真實推播
 * - ESP32 後端輪詢 + 數據儲存
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wi-care-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 10;

// ========================================
// Middleware
// ========================================
app.use(cors());
app.use(express.json());

/** JWT 認證中介層 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供認證 Token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token 已過期，請重新登入' });
    }
    return res.status(401).json({ success: false, message: '無效的 Token' });
  }
};

/** 角色檢查中介層 */
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: '權限不足' });
  }
  next();
};

// ========================================
// HTTP Server + WebSocket
// ========================================
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
const wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('[WS] 新的 WebSocket 連線');
  wsClients.add(ws);

  ws.on('close', () => { wsClients.delete(ws); });
  ws.on('error', () => { wsClients.delete(ws); });

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Wi-Care WebSocket 已連線',
    timestamp: new Date().toISOString()
  }));
});

/** 廣播到所有 WebSocket 客戶端 */
function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const c of wsClients) {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  }
}

// ========================================
// ESP32 後端輪詢
// ========================================
let esp32Interval = null;

async function pollESP32() {
  const devices = db.prepare('SELECT * FROM devices').all();
  for (const device of devices) {
    if (!device.ip_address) continue;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const url = `http://${device.ip_address}:${device.port || 8080}/status`;
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);

      if (!res.ok) { markOffline(device.id); continue; }
      const data = await res.json();

      // 更新設備狀態
      db.prepare(`UPDATE devices SET status='online', last_ping=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(device.id);

      // 儲存感測器數據
      const score = data.movement_score ?? (data.status === 'fall' ? 95 : Math.random() * 15);
      const motion = data.status === 'fall' || data.falling ? 1 : 0;
      db.prepare(`INSERT INTO sensor_data (device_id, movement_score, motion_detected, threshold) VALUES (?,?,?,?)`)
        .run(device.id, score, motion, data.threshold ?? null);

      // WebSocket 推送
      broadcast({
        type: 'sensor_update',
        device_id: device.id,
        movement_score: score,
        motion_detected: !!motion,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      // 跌倒偵測
      if (motion) handleFallAlert(device, data);
    } catch {
      markOffline(device.id);
    }
  }
}

function markOffline(id) {
  const d = db.prepare('SELECT status FROM devices WHERE id=?').get(id);
  if (d && d.status !== 'offline') {
    db.prepare(`UPDATE devices SET status='offline', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(id);
    broadcast({ type: 'device_status', device_id: id, status: 'offline' });
  }
}

// ========================================
// 跌倒警報 + LINE 推播
// ========================================
let lastAlertTime = 0;
const ALERT_COOLDOWN = 30000;

async function handleFallAlert(device, data) {
  if (Date.now() - lastAlertTime < ALERT_COOLDOWN) return;
  lastAlertTime = Date.now();
  console.log(`🚨 [FALL] 設備 ${device.id} (${device.location}) 偵測到跌倒`);

  const elderly = db.prepare('SELECT * FROM elderly WHERE room = ?').get(device.location?.split(' ')[0]);
  const result = db.prepare(`
    INSERT INTO events (elderly_id, device_id, type, severity, message, data)
    VALUES (?, ?, 'fall_alert', 'critical', ?, ?)
  `).run(
    elderly?.id || null, device.id,
    `跌倒警報 - ${device.location || '未知'}${elderly ? ` - ${elderly.name}` : ''}`,
    JSON.stringify({ movement_score: data.movement_score, raw: data })
  );

  broadcast({
    type: 'fall_alert',
    event_id: result.lastInsertRowid,
    device_id: device.id,
    location: device.location,
    elderly: elderly ? { id: elderly.id, name: elderly.name, room: elderly.room } : null,
    timestamp: new Date().toISOString()
  });

  await sendLineNotification(device, elderly);
}

async function sendLineNotification(device, elderly) {
  const token = db.prepare("SELECT value FROM settings WHERE key='line_channel_token'").get()?.value;
  const userId = db.prepare("SELECT value FROM settings WHERE key='line_user_id'").get()?.value;
  if (!token || !userId) { console.log('[LINE] 未設定 Token/UserID，跳過'); return; }

  const ts = new Date().toLocaleString('zh-TW', { hour12: false });
  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: 'flex', altText: '【緊急警報】偵測到跌倒事件！',
          contents: {
            type: 'bubble',
            header: {
              type: 'box', layout: 'vertical', backgroundColor: '#ef4444',
              contents: [
                { type: 'text', text: '🚨 緊急警報', weight: 'bold', color: '#ffffff', size: 'lg' },
                { type: 'text', text: '偵測到跌倒事件', weight: 'bold', color: '#ffffff', size: 'xl', margin: 'md' }
              ]
            },
            body: {
              type: 'box', layout: 'vertical',
              contents: [
                { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
                  { type: 'text', text: '位置', color: '#aaaaaa', size: 'sm', flex: 1 },
                  { type: 'text', text: device.location || '未知', color: '#666666', size: 'sm', flex: 4 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', margin: 'md', contents: [
                  { type: 'text', text: '對象', color: '#aaaaaa', size: 'sm', flex: 1 },
                  { type: 'text', text: elderly?.name || '未知', color: '#666666', size: 'sm', flex: 4 }
                ]},
                { type: 'box', layout: 'baseline', spacing: 'sm', margin: 'md', contents: [
                  { type: 'text', text: '時間', color: '#aaaaaa', size: 'sm', flex: 1 },
                  { type: 'text', text: ts, color: '#666666', size: 'sm', flex: 4 }
                ]}
              ]
            },
            footer: {
              type: 'box', layout: 'vertical', spacing: 'sm',
              contents: [
                { type: 'button', style: 'primary', color: '#ef4444', action: { type: 'uri', label: '撥打 119', uri: 'tel:119' } },
                { type: 'button', style: 'secondary', action: { type: 'uri', label: '開啟 Wi-Care', uri: 'http://localhost:3000' } }
              ]
            }
          }
        }]
      })
    });
    console.log(r.ok ? '[LINE] ✅ 推播成功' : `[LINE] ❌ 推播失敗: ${(await r.json()).message}`);
  } catch (e) { console.error('[LINE] ❌ 錯誤:', e.message); }
}

function startPolling() {
  if (esp32Interval) clearInterval(esp32Interval);
  esp32Interval = setInterval(pollESP32, 2000);
  console.log('[ESP32] 開始輪詢 (每 2 秒)');
}

// ========================================
// 健康檢查
// ========================================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok', version: '2.0.0', database: 'SQLite',
    websocket: `ws://localhost:${PORT}/ws`,
    timestamp: new Date().toISOString()
  });
});

// ========================================
// 認證 API
// ========================================
app.post('/api/auth/register', (req, res) => {
  const { username, password, name, role = 'nurse', phone, email } = req.body;
  if (!username || !password || !name) return res.status(400).json({ success: false, message: '請填寫所有必填欄位' });
  if (username.length < 3) return res.status(400).json({ success: false, message: '帳號至少 3 字元' });
  if (password.length < 6) return res.status(400).json({ success: false, message: '密碼至少 6 字元' });

  if (db.prepare('SELECT id FROM users WHERE username=?').get(username)) {
    return res.status(409).json({ success: false, message: '此帳號已存在' });
  }

  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const r = db.prepare('INSERT INTO users (username,password_hash,name,role,phone,email) VALUES (?,?,?,?,?,?)')
    .run(username, hash, name, role, phone || '', email || '');

  const user = { id: r.lastInsertRowid, username, name, role };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  console.log(`[AUTH] 新使用者: ${username} (${name})`);
  res.status(201).json({ success: true, data: { token, user } });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: '請提供帳號密碼' });

  const user = db.prepare('SELECT * FROM users WHERE username=? AND is_active=1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
  }

  const payload = { id: user.id, username: user.username, name: user.name, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  console.log(`[AUTH] 登入: ${user.name} (${user.role})`);
  res.json({ success: true, data: { token, user: payload } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: '已登出' });
});

app.get('/api/auth/verify', authenticate, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

app.post('/api/auth/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: '請提供密碼' });
  if (newPassword.length < 6) return res.status(400).json({ success: false, message: '新密碼至少 6 字元' });

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ success: false, message: '目前密碼錯誤' });
  }
  db.prepare('UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(bcrypt.hashSync(newPassword, SALT_ROUNDS), req.user.id);
  res.json({ success: true, message: '密碼已變更' });
});

// LINE Login token 交換
app.post('/api/auth/line/token', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: '缺少授權碼' });

  try {
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        redirect_uri: process.env.LINE_REDIRECT_URI || 'http://localhost:3000/auth/line/callback',
        client_id: process.env.LINE_CLIENT_ID || '',
        client_secret: process.env.LINE_CLIENT_SECRET || '',
      })
    });
    if (!tokenRes.ok) return res.status(400).json({ success: false, message: 'LINE 授權失敗' });
    const tokenData = await tokenRes.json();

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();

    let user = db.prepare('SELECT * FROM users WHERE line_user_id=?').get(profile.userId);
    if (!user) {
      const r = db.prepare(
        'INSERT INTO users (username,password_hash,name,role,line_user_id,avatar_url) VALUES (?,?,?,?,?,?)'
      ).run(`line_${profile.userId.substring(0, 10)}`, bcrypt.hashSync(`line_${Date.now()}`, SALT_ROUNDS),
        profile.displayName, 'nurse', profile.userId, profile.pictureUrl || null);
      user = db.prepare('SELECT * FROM users WHERE id=?').get(r.lastInsertRowid);
    }

    const payload = { id: user.id, username: user.username, name: user.name, role: user.role };
    const appToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ success: true, data: { token: appToken, user: { ...payload, pictureUrl: profile.pictureUrl } } });
  } catch (e) {
    console.error('[LINE Auth]', e);
    res.status(500).json({ success: false, message: 'LINE 登入失敗' });
  }
});

// ========================================
// 長者 CRUD
// ========================================
app.get('/api/elderly', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM elderly ORDER BY room').all();
  const data = rows.map(e => ({ ...e, conditions: JSON.parse(e.conditions || '[]'), allergies: JSON.parse(e.allergies || '[]') }));
  res.json({ success: true, data });
});

app.get('/api/elderly/:id', authenticate, (req, res) => {
  const e = db.prepare('SELECT * FROM elderly WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ success: false, message: '找不到此長者' });
  e.conditions = JSON.parse(e.conditions || '[]');
  e.allergies = JSON.parse(e.allergies || '[]');
  res.json({ success: true, data: e });
});

app.post('/api/elderly', authenticate, requireRole('admin', 'nurse'), (req, res) => {
  const { name, age, gender, room, blood_type, emergency_contact, emergency_phone, conditions, allergies, risk_level } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '姓名為必填' });
  const r = db.prepare(`
    INSERT INTO elderly (name,age,gender,room,blood_type,emergency_contact,emergency_phone,conditions,allergies,risk_level)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(name, age, gender, room, blood_type, emergency_contact, emergency_phone, JSON.stringify(conditions || []), JSON.stringify(allergies || []), risk_level || 'low');
  const e = db.prepare('SELECT * FROM elderly WHERE id=?').get(r.lastInsertRowid);
  e.conditions = JSON.parse(e.conditions); e.allergies = JSON.parse(e.allergies);
  res.status(201).json({ success: true, data: e });
});

app.put('/api/elderly/:id', authenticate, requireRole('admin', 'nurse'), (req, res) => {
  const { name, age, gender, room, blood_type, emergency_contact, emergency_phone, conditions, allergies, risk_level, ai_sensitivity } = req.body;
  db.prepare(`
    UPDATE elderly SET name=COALESCE(?,name),age=COALESCE(?,age),gender=COALESCE(?,gender),room=COALESCE(?,room),
    blood_type=COALESCE(?,blood_type),emergency_contact=COALESCE(?,emergency_contact),
    emergency_phone=COALESCE(?,emergency_phone),conditions=COALESCE(?,conditions),
    allergies=COALESCE(?,allergies),risk_level=COALESCE(?,risk_level),ai_sensitivity=COALESCE(?,ai_sensitivity),
    updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(name, age, gender, room, blood_type, emergency_contact, emergency_phone,
    conditions ? JSON.stringify(conditions) : null, allergies ? JSON.stringify(allergies) : null,
    risk_level, ai_sensitivity, req.params.id);
  const e = db.prepare('SELECT * FROM elderly WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ success: false, message: '找不到此長者' });
  e.conditions = JSON.parse(e.conditions || '[]'); e.allergies = JSON.parse(e.allergies || '[]');
  res.json({ success: true, data: e });
});

app.delete('/api/elderly/:id', authenticate, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM elderly WHERE id=?').run(req.params.id);
  res.json({ success: true, message: '已刪除' });
});

app.patch('/api/elderly/:id/status', authenticate, (req, res) => {
  db.prepare('UPDATE elderly SET status=?, last_activity=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(req.body.status, req.params.id);
  const e = db.prepare('SELECT * FROM elderly WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ success: false, message: '找不到此長者' });
  res.json({ success: true, data: e });
});

// ========================================
// 設備 CRUD
// ========================================
app.get('/api/devices', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM devices ORDER BY created_at').all();
  res.json({ success: true, data: rows.map(d => ({ ...d, config: JSON.parse(d.config || '{}') })) });
});

app.get('/api/devices/:id', authenticate, (req, res) => {
  const d = db.prepare('SELECT * FROM devices WHERE id=?').get(req.params.id);
  if (!d) return res.status(404).json({ success: false, message: '找不到此設備' });
  d.config = JSON.parse(d.config || '{}');
  res.json({ success: true, data: d });
});

app.post('/api/devices', authenticate, requireRole('admin', 'nurse'), (req, res) => {
  const { id, name, location, ip_address, port, type } = req.body;
  if (!id) return res.status(400).json({ success: false, message: '設備 ID 為必填' });
  try {
    db.prepare('INSERT INTO devices (id,name,location,ip_address,port,type) VALUES (?,?,?,?,?,?)')
      .run(id, name || id, location, ip_address, port || 8080, type || 'esp32-s3');
    const d = db.prepare('SELECT * FROM devices WHERE id=?').get(id);
    d.config = JSON.parse(d.config || '{}');
    res.status(201).json({ success: true, data: d });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, message: '設備 ID 已存在' });
    throw err;
  }
});

app.put('/api/devices/:id', authenticate, requireRole('admin', 'nurse'), (req, res) => {
  const { name, location, ip_address, port, type, sensitivity, config } = req.body;
  db.prepare(`
    UPDATE devices SET name=COALESCE(?,name),location=COALESCE(?,location),ip_address=COALESCE(?,ip_address),
    port=COALESCE(?,port),type=COALESCE(?,type),sensitivity=COALESCE(?,sensitivity),
    config=COALESCE(?,config),updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(name, location, ip_address, port, type, sensitivity, config ? JSON.stringify(config) : null, req.params.id);
  const d = db.prepare('SELECT * FROM devices WHERE id=?').get(req.params.id);
  if (!d) return res.status(404).json({ success: false, message: '找不到此設備' });
  d.config = JSON.parse(d.config || '{}');
  res.json({ success: true, data: d });
});

app.delete('/api/devices/:id', authenticate, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM devices WHERE id=?').run(req.params.id);
  res.json({ success: true, message: '已刪除' });
});

app.post('/api/devices/:id/heartbeat', (req, res) => {
  let d = db.prepare('SELECT * FROM devices WHERE id=?').get(req.params.id);
  if (!d) {
    db.prepare('INSERT INTO devices (id,location,status,last_ping) VALUES (?,?,?,CURRENT_TIMESTAMP)')
      .run(req.params.id, req.body.location || '未指定', 'online');
    d = db.prepare('SELECT * FROM devices WHERE id=?').get(req.params.id);
    return res.status(201).json({ success: true, data: d });
  }
  db.prepare('UPDATE devices SET status=?,last_ping=CURRENT_TIMESTAMP WHERE id=?').run('online', req.params.id);
  d.status = 'online';
  res.json({ success: true, data: d });
});

app.post('/api/devices/:id/reboot', authenticate, requireRole('admin', 'nurse'), async (req, res) => {
  const d = db.prepare('SELECT * FROM devices WHERE id=?').get(req.params.id);
  if (!d) return res.status(404).json({ success: false, message: '找不到此設備' });
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    await fetch(`http://${d.ip_address}:${d.port || 8080}/reboot`, { method: 'POST', signal: ctrl.signal });
    res.json({ success: true, message: '重啟指令已發送' });
  } catch { res.status(502).json({ success: false, message: '無法連線到設備' }); }
});

// ========================================
// 感測器數據 API
// ========================================
app.get('/api/sensor-data/latest', authenticate, (req, res) => {
  const { device_id } = req.query;
  const q = device_id
    ? db.prepare('SELECT * FROM sensor_data WHERE device_id=? ORDER BY timestamp DESC LIMIT 1').get(device_id)
    : db.prepare('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1').get();
  res.json({ success: true, data: q || null });
});

app.get('/api/sensor-data/history', authenticate, (req, res) => {
  const { device_id, limit = 200, hours = 1 } = req.query;
  const since = new Date(Date.now() - parseInt(hours) * 3600000).toISOString();
  let q = 'SELECT * FROM sensor_data WHERE timestamp > ?';
  const p = [since];
  if (device_id) { q += ' AND device_id=?'; p.push(device_id); }
  q += ' ORDER BY timestamp DESC LIMIT ?';
  p.push(parseInt(limit));
  res.json({ success: true, data: db.prepare(q).all(...p).reverse() });
});

// Python Bridge 推送端點
app.post('/api/sensor-data/push', (req, res) => {
  const { device_id, movement_score, motion_detected, threshold, raw_csi, ai_analysis } = req.body;
  if (device_id == null || movement_score == null) {
    return res.status(400).json({ success: false, message: '缺少必要欄位' });
  }

  db.prepare('INSERT INTO sensor_data (device_id,movement_score,motion_detected,threshold,raw_csi) VALUES (?,?,?,?,?)')
    .run(device_id, movement_score, motion_detected ? 1 : 0, threshold, raw_csi ? JSON.stringify(raw_csi) : null);

  broadcast({
    type: 'sensor_update', device_id, movement_score,
    motion_detected: !!motion_detected, ai_analysis,
    timestamp: new Date().toISOString()
  });

  if (motion_detected) {
    const d = db.prepare('SELECT * FROM devices WHERE id=?').get(device_id);
    if (d) handleFallAlert(d, { movement_score, status: 'fall' });
  }
  res.json({ success: true });
});

// ========================================
// 事件紀錄 API
// ========================================
app.get('/api/events', authenticate, (req, res) => {
  const { elderly_id, type, severity, limit = 50, offset = 0 } = req.query;
  let q = 'SELECT e.*, el.name as elderly_name FROM events e LEFT JOIN elderly el ON e.elderly_id=el.id WHERE 1=1';
  const p = [];
  if (elderly_id) { q += ' AND e.elderly_id=?'; p.push(elderly_id); }
  if (type) { q += ' AND e.type=?'; p.push(type); }
  if (severity) { q += ' AND e.severity=?'; p.push(severity); }
  q += ' ORDER BY e.timestamp DESC LIMIT ? OFFSET ?';
  p.push(parseInt(limit), parseInt(offset));
  const data = db.prepare(q).all(...p);
  const total = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  res.json({ success: true, data, total });
});

app.post('/api/events', authenticate, (req, res) => {
  const { elderly_id, device_id, type, severity = 'info', message, data: ed } = req.body;
  const r = db.prepare('INSERT INTO events (elderly_id,device_id,type,severity,message,data) VALUES (?,?,?,?,?,?)')
    .run(elderly_id, device_id, type, severity, message, ed ? JSON.stringify(ed) : '{}');
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM events WHERE id=?').get(r.lastInsertRowid) });
});

app.post('/api/events/:id/false-alarm', authenticate, (req, res) => {
  db.prepare('UPDATE events SET is_false_alarm=1, resolved_at=CURRENT_TIMESTAMP, resolved_by=? WHERE id=?')
    .run(req.user.id, req.params.id);
  res.json({ success: true, message: '已標記為誤報' });
});

app.post('/api/events/:id/resolve', authenticate, (req, res) => {
  db.prepare('UPDATE events SET resolved_at=CURRENT_TIMESTAMP, resolved_by=? WHERE id=?')
    .run(req.user.id, req.params.id);
  broadcast({ type: 'alert_resolved', event_id: parseInt(req.params.id) });
  res.json({ success: true, message: '警報已解除' });
});

// ========================================
// 跌倒偵測 API (向後相容)
// ========================================
app.post('/api/fall-detection/alert', (req, res) => {
  const { deviceId, csiData, accelerometerData } = req.body;
  console.log(`[ALERT] 跌倒警報 from ${deviceId}`);
  const device = db.prepare('SELECT * FROM devices WHERE id=?').get(deviceId);
  const elderly = device ? db.prepare('SELECT * FROM elderly WHERE room=?').get(device.location?.split(' ')[0]) : null;
  const r = db.prepare('INSERT INTO events (elderly_id,device_id,type,severity,message,data) VALUES (?,?,?,?,?,?)')
    .run(elderly?.id, deviceId, 'fall_alert', 'critical', `跌倒警報 - ${deviceId}`, JSON.stringify({ csiData, accelerometerData }));
  broadcast({ type: 'fall_alert', event_id: r.lastInsertRowid, device_id: deviceId, timestamp: new Date().toISOString() });
  res.json({ success: true, eventId: r.lastInsertRowid });
});

app.post('/api/fall-detection/clear', (req, res) => {
  const { deviceId, clearedBy } = req.body;
  db.prepare('INSERT INTO events (device_id,type,severity,message) VALUES (?,?,?,?)')
    .run(deviceId, 'alert_cleared', 'info', `警報清除 by ${clearedBy || '系統'}`);
  broadcast({ type: 'alert_cleared', device_id: deviceId });
  res.json({ success: true, message: '警報已清除' });
});

app.get('/api/fall-detection/status', (_req, res) => {
  const alerts = db.prepare("SELECT * FROM events WHERE type='fall_alert' AND resolved_at IS NULL ORDER BY timestamp DESC LIMIT 10").all();
  const onDev = db.prepare("SELECT COUNT(*) as c FROM devices WHERE status='online'").get().c;
  const totDev = db.prepare('SELECT COUNT(*) as c FROM devices').get().c;
  res.json({ success: true, data: { hasActiveAlert: alerts.length > 0, activeAlerts: alerts, onlineDevices: onDev, totalDevices: totDev } });
});

// ========================================
// 排班 API
// ========================================
app.get('/api/shifts', authenticate, (req, res) => {
  const { date, user_id } = req.query;
  let q = 'SELECT s.*,u.name as nurse_name,e.name as elderly_name,e.room FROM shifts s LEFT JOIN users u ON s.user_id=u.id LEFT JOIN elderly e ON s.elderly_id=e.id WHERE 1=1';
  const p = [];
  if (date) { q += ' AND s.shift_date=?'; p.push(date); }
  if (user_id) { q += ' AND s.user_id=?'; p.push(user_id); }
  q += ' ORDER BY s.shift_date,s.shift_type';
  res.json({ success: true, data: db.prepare(q).all(...p) });
});

app.post('/api/shifts', authenticate, requireRole('admin', 'nurse'), (req, res) => {
  const { user_id, elderly_id, shift_date, shift_type, notes } = req.body;
  if (!user_id || !elderly_id || !shift_date || !shift_type)
    return res.status(400).json({ success: false, message: '缺少必要欄位' });
  const r = db.prepare('INSERT INTO shifts (user_id,elderly_id,shift_date,shift_type,notes) VALUES (?,?,?,?,?)')
    .run(user_id, elderly_id, shift_date, shift_type, notes);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM shifts WHERE id=?').get(r.lastInsertRowid) });
});

app.delete('/api/shifts/:id', authenticate, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM shifts WHERE id=?').run(req.params.id);
  res.json({ success: true, message: '已刪除' });
});

// ========================================
// 護理人員 API
// ========================================
app.get('/api/caregivers', authenticate, (req, res) => {
  res.json({
    success: true,
    data: db.prepare("SELECT id,username,name,role,phone,email,avatar_url,is_active,created_at FROM users WHERE role IN ('nurse','admin') ORDER BY name").all()
  });
});

app.post('/api/caregivers', authenticate, requireRole('admin'), (req, res) => {
  const { username, password, name, role = 'nurse', phone, email } = req.body;
  if (!username || !password || !name) return res.status(400).json({ success: false, message: '缺少必要欄位' });
  try {
    const r = db.prepare('INSERT INTO users (username,password_hash,name,role,phone,email) VALUES (?,?,?,?,?,?)')
      .run(username, bcrypt.hashSync(password, SALT_ROUNDS), name, role, phone || '', email || '');
    res.status(201).json({ success: true, data: db.prepare('SELECT id,username,name,role,phone,email FROM users WHERE id=?').get(r.lastInsertRowid) });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, message: '帳號已存在' });
    throw err;
  }
});

app.put('/api/caregivers/:id', authenticate, requireRole('admin'), (req, res) => {
  const { name, phone, email, role, is_active } = req.body;
  db.prepare('UPDATE users SET name=COALESCE(?,name),phone=COALESCE(?,phone),email=COALESCE(?,email),role=COALESCE(?,role),is_active=COALESCE(?,is_active),updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(name, phone, email, role, is_active, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT id,username,name,role,phone,email,is_active FROM users WHERE id=?').get(req.params.id) });
});

app.delete('/api/caregivers/:id', authenticate, requireRole('admin'), (req, res) => {
  db.prepare('UPDATE users SET is_active=0 WHERE id=?').run(req.params.id);
  res.json({ success: true, message: '已停用' });
});

// ========================================
// 統計 API
// ========================================
app.get('/api/stats/dashboard', authenticate, (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ts = today.toISOString();
  res.json({
    success: true,
    data: {
      totalElderly: db.prepare('SELECT COUNT(*) as c FROM elderly').get().c,
      onlineDevices: db.prepare("SELECT COUNT(*) as c FROM devices WHERE status='online'").get().c,
      totalDevices: db.prepare('SELECT COUNT(*) as c FROM devices').get().c,
      todayEvents: db.prepare('SELECT COUNT(*) as c FROM events WHERE timestamp>?').get(ts).c,
      todayFallAlerts: db.prepare("SELECT COUNT(*) as c FROM events WHERE type='fall_alert' AND timestamp>?").get(ts).c,
      unresolvedAlerts: db.prepare("SELECT COUNT(*) as c FROM events WHERE type='fall_alert' AND resolved_at IS NULL").get().c,
      lastUpdate: new Date().toISOString()
    }
  });
});

app.get('/api/stats/activity-trend', authenticate, (req, res) => {
  const { device_id, hours = 24 } = req.query;
  const since = new Date(Date.now() - parseInt(hours) * 3600000).toISOString();
  let q = `SELECT strftime('%Y-%m-%d %H:00',timestamp) as hour, AVG(movement_score) as avg_score,
    MAX(movement_score) as max_score, SUM(motion_detected) as motion_count, COUNT(*) as data_points
    FROM sensor_data WHERE timestamp>?`;
  const p = [since];
  if (device_id) { q += ' AND device_id=?'; p.push(device_id); }
  q += ' GROUP BY hour ORDER BY hour';
  res.json({ success: true, data: db.prepare(q).all(...p) });
});

// ========================================
// 系統設定 API
// ========================================
app.get('/api/settings', authenticate, requireRole('admin'), (req, res) => {
  const m = {};
  for (const s of db.prepare('SELECT * FROM settings').all()) m[s.key] = s.value;
  res.json({ success: true, data: m });
});

app.put('/api/settings', authenticate, requireRole('admin'), (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP');
  const tx = db.transaction((entries) => { for (const [k, v] of entries) upsert.run(k, String(v)); });
  tx(Object.entries(req.body));
  res.json({ success: true, message: '設定已更新' });
});

// ========================================
// 數據清理
// ========================================
function cleanOldData() {
  const days = parseInt(db.prepare("SELECT value FROM settings WHERE key='data_retention_days'").get()?.value || '90');
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const r = db.prepare('DELETE FROM sensor_data WHERE timestamp<?').run(cutoff);
  if (r.changes > 0) console.log(`[DB] 清理 ${r.changes} 筆過期數據`);
}
setInterval(cleanOldData, 3600000);

// ========================================
// 啟動
// ========================================
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║                                                  ║');
  console.log('║   🏥 Wi-Care 後端服務 v2.0                      ║');
  console.log('║                                                  ║');
  console.log(`║   📡 REST API:  http://localhost:${PORT}/api         ║`);
  console.log(`║   🔌 WebSocket: ws://localhost:${PORT}/ws            ║`);
  console.log('║   💾 資料庫:    SQLite (data/wicare.db)          ║');
  console.log('║   🔐 認證:      JWT + bcrypt                    ║');
  console.log('║                                                  ║');
  console.log('║   帳號: admin/admin123  nurse1/nurse123          ║');
  console.log('║         family1/family123                        ║');
  console.log('║                                                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  startPolling();
  cleanOldData();
});
