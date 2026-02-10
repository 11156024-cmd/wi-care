/**
 * Wi-Care SQLite 資料庫模組
 * 使用 Node.js 24 內建的 node:sqlite (零依賴)
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'wicare.db');

// 確保 data 目錄存在
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// 啟用 WAL 模式 + 外鍵
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ========================================
// 建立資料表
// ========================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'nurse' CHECK(role IN ('admin','nurse','family')),
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    line_user_id TEXT,
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS elderly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT DEFAULT 'unknown',
    room TEXT,
    blood_type TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    conditions TEXT DEFAULT '[]',
    allergies TEXT DEFAULT '[]',
    risk_level TEXT DEFAULT 'low',
    status TEXT DEFAULT 'safe',
    ai_sensitivity REAL DEFAULT 1.0,
    last_activity DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    ip_address TEXT,
    port INTEGER DEFAULT 8080,
    type TEXT DEFAULT 'esp32-s3',
    firmware_version TEXT DEFAULT 'unknown',
    status TEXT DEFAULT 'offline',
    sensitivity REAL DEFAULT 1.0,
    config TEXT DEFAULT '{}',
    last_ping DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
    movement_score REAL NOT NULL,
    motion_detected INTEGER DEFAULT 0,
    threshold REAL,
    raw_csi TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    elderly_id INTEGER REFERENCES elderly(id) ON DELETE SET NULL,
    device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
    message TEXT,
    ai_analysis TEXT,
    is_false_alarm INTEGER DEFAULT 0,
    resolved_at DATETIME,
    resolved_by INTEGER REFERENCES users(id),
    data TEXT DEFAULT '{}',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    elderly_id INTEGER REFERENCES elderly(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_type TEXT CHECK(shift_type IN ('morning','afternoon','night')),
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','active','completed','cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sensor_data_device ON sensor_data(device_id, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_sensor_data_time ON sensor_data(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(type, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_events_elderly ON events(elderly_id, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date, user_id);
`);

// ========================================
// 種子數據 (首次啟動時寫入)
// ========================================
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('[DB] 首次啟動，寫入預設數據...');

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, name, role, phone, email) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const SALT = bcrypt.genSaltSync(10);
  insertUser.run('admin', bcrypt.hashSync('admin123', SALT), '系統管理員', 'admin', '0912-345-678', 'admin@wicare.tw');
  insertUser.run('nurse1', bcrypt.hashSync('nurse123', SALT), '王小明', 'nurse', '0923-456-789', 'nurse1@wicare.tw');
  insertUser.run('nurse2', bcrypt.hashSync('nurse123', SALT), '李小華', 'nurse', '0934-567-890', 'nurse2@wicare.tw');
  insertUser.run('family1', bcrypt.hashSync('family123', SALT), '陳家屬', 'family', '0945-678-901', 'family1@wicare.tw');

  const insertElderly = db.prepare(
    'INSERT INTO elderly (name, age, gender, room, blood_type, emergency_contact, emergency_phone, conditions, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertElderly.run('陳阿嬤', 78, 'female', 'A101', 'A+', '陳大明', '0912-000-001', '["高血壓","糖尿病"]', 'medium');
  insertElderly.run('林阿公', 82, 'male', 'A102', 'O+', '林美玲', '0912-000-002', '["心臟病"]', 'high');
  insertElderly.run('張阿嬤', 75, 'female', 'B201', 'B+', '張志明', '0912-000-003', '[]', 'low');

  const insertDevice = db.prepare(
    'INSERT INTO devices (id, name, location, ip_address, port, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insertDevice.run('Wi-Care-Station-01', 'A101 浴室感測器', 'A101 浴室', '172.20.10.9', 8080, 'esp32-s3', 'offline');
  insertDevice.run('Wi-Care-Station-02', 'A102 浴室感測器', 'A102 浴室', '172.20.10.10', 8080, 'esp32-s3', 'offline');
  insertDevice.run('Wi-Care-Station-03', 'B201 浴室感測器', 'B201 浴室', '172.20.10.11', 8080, 'esp32-c6', 'offline');

  const insertSetting = db.prepare(
    'INSERT INTO settings (key, value, description) VALUES (?, ?, ?)'
  );
  insertSetting.run('line_channel_token', '', 'LINE Messaging API Channel Access Token');
  insertSetting.run('line_user_id', '', 'LINE 推播目標使用者 ID');
  insertSetting.run('ai_provider', 'gemini', 'AI 分析服務 (gemini/local)');
  insertSetting.run('fall_threshold', '0.8', '跌倒偵測閾值 (0.0-1.0)');
  insertSetting.run('alert_cooldown', '30', '警報冷卻時間 (秒)');
  insertSetting.run('data_retention_days', '90', '數據保留天數');

  const insertEvent = db.prepare(
    'INSERT INTO events (elderly_id, device_id, type, severity, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertEvent.run(1, 'Wi-Care-Station-01', 'activity', 'info', '正常活動', '2026-02-10T09:30:00');
  insertEvent.run(2, 'Wi-Care-Station-02', 'activity', 'info', '起床活動', '2026-02-10T06:25:00');
  insertEvent.run(1, 'Wi-Care-Station-01', 'fall_alert', 'critical', '偵測到跌倒事件', '2026-02-09T14:15:00');
  insertEvent.run(1, 'Wi-Care-Station-01', 'alert_cleared', 'info', '警報已解除 - 操作者: 王小明', '2026-02-09T14:18:00');

  console.log('[DB] ✅ 預設數據已寫入');
}

console.log(`[DB] ✅ SQLite 已載入: ${DB_PATH}`);

export default db;
