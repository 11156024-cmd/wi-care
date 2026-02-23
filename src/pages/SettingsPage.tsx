import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Wifi,
  Volume2,
  VolumeX,
  Save,
  RotateCcw,
  ChevronRight,
  User,
  Lock,
  Database,
  Mail,
  Smartphone,
  Clock,
  AlertTriangle,
  Check,
  X,
  CheckCircle,
  XCircle,
  Info,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  MessageCircle,
  Loader2,
  Key
} from 'lucide-react';
import { settingsApi, userApi, getAuthToken } from '../services/ApiService';

// ========================================
// Toast 元件
// ========================================
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => (
  <div className="toast-container">
    {toasts.map(toast => (
      <div key={toast.id} className={`toast toast-${toast.type}`}>
        <span className="toast-icon">
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <XCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          {toast.type === 'warning' && <AlertTriangle size={18} />}
        </span>
        <span className="toast-message">{toast.message}</span>
        <button className="toast-close" onClick={() => onRemove(toast.id)}>
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// ========================================
// 設定區塊定義
// ========================================
interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SETTING_SECTIONS: SettingSection[] = [
  { id: 'general', title: '一般設定', icon: <Settings size={20} /> },
  { id: 'notifications', title: '通知設定', icon: <Bell size={20} /> },
  { id: 'security', title: '安全性', icon: <Shield size={20} /> },
  { id: 'device', title: '裝置設定', icon: <Wifi size={20} /> },
  { id: 'account', title: '帳號設定', icon: <User size={20} /> },
  { id: 'data', title: '資料管理', icon: <Database size={20} /> },
];

// ========================================
// 主元件
// ========================================
const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = React.useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 一般設定
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState('zh-TW');
  const [timezone, setTimezone] = useState('Asia/Taipei');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5');

  // 通知設定
  const [notifications, setNotifications] = useState({
    fallAlert: true,
    healthReminder: true,
    systemUpdate: false,
    email: true,
    sms: false,
    line: true,
  });
  const [lineToken, setLineToken] = useState('');
  const [lineUserId, setLineUserId] = useState('');
  const [lineTokenVisible, setLineTokenVisible] = useState(false);
  const [notifEmail, setNotifEmail] = useState('');
  const [alertCooldown, setAlertCooldown] = useState('30');

  // ESP32 裝置設定
  const [esp32Settings, setEsp32Settings] = useState({
    ip: '192.168.0.101',
    port: '8080',
    autoConnect: true,
    pollingInterval: 2000,
    sensitivity: 50,
    location: '浴室',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // 帳號設定
  const [accountForm, setAccountForm] = useState({
    id: 0,
    displayName: '',
    email: '',
    phone: '',
    username: '',
    role: '',
    isEditing: false,
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // 密碼變更
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // 其他 Modal
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 登入歷史（模擬資料）
  const loginHistory = [
    { date: '2026-02-23 09:15:32', device: 'Chrome / Windows', ip: '192.168.0.100', status: '成功' },
    { date: '2026-02-22 14:23:18', device: 'Safari / macOS', ip: '192.168.0.105', status: '成功' },
    { date: '2026-02-21 08:45:01', device: 'Chrome / Android', ip: '192.168.0.112', status: '成功' },
    { date: '2026-02-20 22:10:55', device: 'Firefox / Windows', ip: '192.168.0.100', status: '失敗' },
  ];

  // ========================================
  // 初始化：從 API 和 localStorage 載入設定
  // ========================================
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const savedUser = localStorage.getItem('wi-care-user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          setAccountForm(prev => ({
            ...prev,
            id: u.id || 0,
            displayName: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            username: u.username || '',
            role: u.role || '',
          }));
        }

        const token = getAuthToken();
        if (token) {
          const serverSettings = await settingsApi.getAll();
          if (serverSettings.line_channel_token) setLineToken(serverSettings.line_channel_token);
          if (serverSettings.line_user_id) setLineUserId(serverSettings.line_user_id);
          if (serverSettings.alert_cooldown) setAlertCooldown(serverSettings.alert_cooldown);
          if (serverSettings.notif_email) setNotifEmail(serverSettings.notif_email);
          if (serverSettings.esp32_ip) setEsp32Settings(prev => ({ ...prev, ip: serverSettings.esp32_ip }));
          if (serverSettings.esp32_port) setEsp32Settings(prev => ({ ...prev, port: serverSettings.esp32_port }));
          if (serverSettings.esp32_location) setEsp32Settings(prev => ({ ...prev, location: serverSettings.esp32_location }));
          if (serverSettings.esp32_sensitivity) setEsp32Settings(prev => ({ ...prev, sensitivity: parseInt(serverSettings.esp32_sensitivity) }));
        }

        const localSettings = localStorage.getItem('wi-care-settings');
        if (localSettings) {
          const ls = JSON.parse(localSettings);
          if (ls.isDarkMode !== undefined) setIsDarkMode(ls.isDarkMode);
          if (ls.soundEnabled !== undefined) setSoundEnabled(ls.soundEnabled);
          if (ls.language) setLanguage(ls.language);
          if (ls.timezone) setTimezone(ls.timezone);
          if (ls.autoRefresh !== undefined) setAutoRefresh(ls.autoRefresh);
          if (ls.refreshInterval) setRefreshInterval(ls.refreshInterval);
          if (ls.notifications) setNotifications(ls.notifications);
          if (ls.esp32AutoConnect !== undefined) setEsp32Settings(prev => ({ ...prev, autoConnect: ls.esp32AutoConnect }));
          if (ls.esp32PollingInterval) setEsp32Settings(prev => ({ ...prev, pollingInterval: ls.esp32PollingInterval }));
        }
      } catch {
        showToast('載入設定時發生警告', 'warning');
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // ========================================
  // 儲存設定
  // ========================================
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const localSettings = {
        isDarkMode, soundEnabled, language, timezone, autoRefresh, refreshInterval,
        notifications, esp32AutoConnect: esp32Settings.autoConnect,
        esp32PollingInterval: esp32Settings.pollingInterval,
      };
      localStorage.setItem('wi-care-settings', JSON.stringify(localSettings));

      const token = getAuthToken();
      if (token) {
        await settingsApi.update({
          line_channel_token: lineToken,
          line_user_id: lineUserId,
          alert_cooldown: alertCooldown,
          notif_email: notifEmail,
          esp32_ip: esp32Settings.ip,
          esp32_port: esp32Settings.port,
          esp32_location: esp32Settings.location,
          esp32_sensitivity: String(esp32Settings.sensitivity),
        });
      }
      showToast('設定已成功儲存', 'success');
    } catch (err: any) {
      showToast(`儲存失敗：${err.message || '未知錯誤'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================
  // 測試 ESP32 連線
  // ========================================
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const url = `http://${esp32Settings.ip}:${esp32Settings.port}/status`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        setTestResult({ ok: true, msg: `連線成功！裝置狀態：${data.status || 'online'}` });
        showToast('ESP32 連線測試成功！', 'success');
      } else {
        setTestResult({ ok: false, msg: `連線失敗 (HTTP ${res.status})` });
        showToast('ESP32 連線失敗', 'error');
      }
    } catch (err: any) {
      const msg = err.name === 'AbortError' ? '連線逾時（5 秒）' : '無法連接裝置';
      setTestResult({ ok: false, msg });
      showToast(msg, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  // ========================================
  // 變更密碼
  // ========================================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('新密碼與確認密碼不一致', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('新密碼長度至少需要 6 個字元', 'warning');
      return;
    }
    setPasswordLoading(true);
    const result = await userApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      showToast('密碼已成功變更！', 'success');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showToast(result.message, 'error');
    }
    setPasswordLoading(false);
  };

  // ========================================
  // 儲存帳號資料
  // ========================================
  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    const result = await userApi.updateProfile(accountForm.id, {
      name: accountForm.displayName,
      email: accountForm.email,
      phone: accountForm.phone,
    });
    if (result.success) {
      const savedUser = localStorage.getItem('wi-care-user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        localStorage.setItem('wi-care-user', JSON.stringify({
          ...u, name: accountForm.displayName, email: accountForm.email, phone: accountForm.phone,
        }));
      }
      showToast('帳號資料已更新', 'success');
      setAccountForm(prev => ({ ...prev, isEditing: false }));
    } else {
      showToast(result.message, 'error');
    }
    setIsSavingAccount(false);
  };

  // ========================================
  // 匯出資料
  // ========================================
  const handleExportData = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [statsRes, eventsRes] = await Promise.all([
        fetch('http://localhost:3001/api/stats/dashboard', { headers }),
        fetch('http://localhost:3001/api/events?limit=200', { headers }),
      ]);
      const stats = statsRes.ok ? (await statsRes.json()).data : {};
      const events = eventsRes.ok ? (await eventsRes.json()).data || [] : [];

      const exportData = {
        exportTime: new Date().toISOString(),
        system: 'Wi-Care 智慧照護系統',
        stats,
        events,
      };

      let blob: Blob;
      let filename: string;

      if (format === 'json') {
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `wi-care-export-${Date.now()}.json`;
      } else {
        const rows = [
          ['時間', '類型', '嚴重程度', '訊息', '對象'],
          ...events.map((e: any) => [
            e.timestamp || '', e.type || '', e.severity || '', e.message || '', e.elderly_name || '',
          ]),
        ];
        const csv = rows.map((r: string[]) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        filename = `wi-care-events-${Date.now()}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`${format.toUpperCase()} 檔案已下載`, 'success');
      setShowExportModal(false);
    } catch (err: any) {
      showToast(`匯出失敗：${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // ========================================
  // 清除快取 / 重置
  // ========================================
  const handleClearCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wi-care-') && key !== 'wi-care-token' && key !== 'wi-care-user') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    showToast(`快取已清除，共 ${keysToRemove.length} 項`, 'success');
    setShowClearCacheModal(false);
  };

  const handleReset = () => {
    setIsDarkMode(false);
    setSoundEnabled(true);
    setLanguage('zh-TW');
    setTimezone('Asia/Taipei');
    setAutoRefresh(true);
    setRefreshInterval('5');
    setNotifications({ fallAlert: true, healthReminder: true, systemUpdate: false, email: true, sms: false, line: true });
    setEsp32Settings({ ip: '192.168.0.101', port: '8080', autoConnect: true, pollingInterval: 2000, sensitivity: 50, location: '浴室' });
    localStorage.removeItem('wi-care-settings');
    showToast('所有設定已重置為預設值', 'info');
    setShowResetModal(false);
  };

  // ========================================
  // 各區塊渲染
  // ========================================
  const renderSection = () => {
    if (isLoading) {
      return (
        <div className="settings-loading">
          <Loader2 size={32} className="spin" />
          <p>載入設定中...</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'general':
        return (
          <div className="settings-section">
            <h3 className="section-title">一般設定</h3>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">深色模式</span>
                <span className="setting-desc">切換介面深色主題</span>
              </div>
              <div className="setting-control">
                <button className={`toggle-btn ${isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                  <span>{isDarkMode ? '深色' : '淺色'}</span>
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Volume2 size={18} />
                <span className="setting-label">警報音效</span>
                <span className="setting-desc">跌倒偵測時播放警報音效</span>
              </div>
              <div className="setting-control">
                <button className={`toggle-btn ${soundEnabled ? 'active' : ''}`} onClick={() => setSoundEnabled(!soundEnabled)}>
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  <span>{soundEnabled ? '開啟' : '關閉'}</span>
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Globe size={18} />
                <span className="setting-label">語言</span>
                <span className="setting-desc">選擇系統顯示語言</span>
              </div>
              <div className="setting-control">
                <select className="setting-select" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Clock size={18} />
                <span className="setting-label">時區</span>
                <span className="setting-desc">選擇所在時區</span>
              </div>
              <div className="setting-control">
                <select className="setting-select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Taipei">台北 (GMT+8)</option>
                  <option value="Asia/Tokyo">東京 (GMT+9)</option>
                  <option value="America/New_York">紐約 (GMT-5)</option>
                  <option value="Europe/London">倫敦 (GMT+0)</option>
                </select>
              </div>
            </div>

            <div className="setting-group">
              <h4 className="group-title">資料更新</h4>
              <div className="setting-item">
                <div className="setting-info">
                  <RefreshCw size={18} />
                  <span className="setting-label">自動更新</span>
                  <span className="setting-desc">定期自動重新整理資料</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              {autoRefresh && (
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">更新間隔</span>
                    <span className="setting-desc">每隔幾秒重新整理</span>
                  </div>
                  <div className="setting-control">
                    <select className="setting-select" value={refreshInterval} onChange={e => setRefreshInterval(e.target.value)}>
                      <option value="3">3 秒</option>
                      <option value="5">5 秒</option>
                      <option value="10">10 秒</option>
                      <option value="30">30 秒</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <h3 className="section-title">通知設定</h3>

            <div className="setting-group">
              <h4 className="group-title">事件類型</h4>
              {[
                { key: 'fallAlert', label: '跌倒警報', desc: '偵測到跌倒時立即通知' },
                { key: 'healthReminder', label: '健康提醒', desc: '定期健康狀態提醒' },
                { key: 'systemUpdate', label: '系統更新', desc: '新版本通知' },
              ].map(({ key, label, desc }) => (
                <div className="setting-item" key={key}>
                  <div className="setting-info">
                    <span className="setting-label">{label}</span>
                    <span className="setting-desc">{desc}</span>
                  </div>
                  <div className="setting-control">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={(notifications as any)[key]}
                        onChange={e => setNotifications({ ...notifications, [key]: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="setting-group">
              <h4 className="group-title">通知方式</h4>

              <div className="setting-item">
                <div className="setting-info">
                  <Mail size={18} />
                  <span className="setting-label">電子郵件通知</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" checked={notifications.email} onChange={e => setNotifications({ ...notifications, email: e.target.checked })} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              {notifications.email && (
                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <span className="setting-label">通知信箱</span>
                  </div>
                  <div className="setting-control">
                    <input type="email" className="setting-input" value={notifEmail}
                      onChange={e => setNotifEmail(e.target.value)} placeholder="example@email.com" />
                  </div>
                </div>
              )}

              <div className="setting-item">
                <div className="setting-info">
                  <Smartphone size={18} />
                  <span className="setting-label">簡訊 (SMS)</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" checked={notifications.sms} onChange={e => setNotifications({ ...notifications, sms: e.target.checked })} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <MessageCircle size={18} />
                  <span className="setting-label">LINE 通知</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" checked={notifications.line} onChange={e => setNotifications({ ...notifications, line: e.target.checked })} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {notifications.line && (
                <>
                  <div className="setting-item sub-item">
                    <div className="setting-info">
                      <Key size={16} />
                      <span className="setting-label">Channel Access Token</span>
                      <span className="setting-desc">LINE Messaging API Token</span>
                    </div>
                    <div className="setting-control password-control">
                      <input
                        type={lineTokenVisible ? 'text' : 'password'}
                        className="setting-input"
                        value={lineToken}
                        onChange={e => setLineToken(e.target.value)}
                        placeholder="LINE Channel Access Token"
                      />
                      <button className="eye-btn" onClick={() => setLineTokenVisible(!lineTokenVisible)}>
                        {lineTokenVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="setting-item sub-item">
                    <div className="setting-info">
                      <User size={16} />
                      <span className="setting-label">LINE User ID</span>
                      <span className="setting-desc">接收通知的使用者 ID</span>
                    </div>
                    <div className="setting-control">
                      <input type="text" className="setting-input" value={lineUserId}
                        onChange={e => setLineUserId(e.target.value)} placeholder="U1234567890abcdef..." />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="setting-group">
              <h4 className="group-title">警報設定</h4>
              <div className="setting-item">
                <div className="setting-info">
                  <AlertTriangle size={18} />
                  <span className="setting-label">警報冷卻時間</span>
                  <span className="setting-desc">同一裝置兩次警報之間的最短間隔</span>
                </div>
                <div className="setting-control">
                  <select className="setting-select" value={alertCooldown} onChange={e => setAlertCooldown(e.target.value)}>
                    <option value="10">10 秒</option>
                    <option value="30">30 秒</option>
                    <option value="60">60 秒</option>
                    <option value="120">120 秒</option>
                    <option value="300">300 秒</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <h3 className="section-title">安全性設定</h3>

            <div className="setting-item clickable" onClick={() => setShowPasswordModal(true)}>
              <div className="setting-info">
                <Lock size={18} />
                <span className="setting-label">變更密碼</span>
                <span className="setting-desc">更新您的登入密碼</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Shield size={18} />
                <span className="setting-label">JWT 驗證</span>
                <span className="setting-desc">目前使用 JWT + bcrypt 加密</span>
              </div>
              <div className="setting-status enabled">已啟用</div>
            </div>

            <div className="setting-item clickable" onClick={() => setShowLoginHistoryModal(true)}>
              <div className="setting-info">
                <Clock size={18} />
                <span className="setting-label">登入紀錄</span>
                <span className="setting-desc">查看最近的登入活動</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-group">
              <h4 className="group-title">進階安全</h4>
              <div className="setting-item">
                <div className="setting-info">
                  <Clock size={18} />
                  <span className="setting-label">Token 有效期</span>
                  <span className="setting-desc">登入狀態的過期時間</span>
                </div>
                <div className="setting-control">
                  <select className="setting-select">
                    <option value="24h">24 小時（預設）</option>
                    <option value="7d">7 天</option>
                    <option value="30d">30 天</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'device':
        return (
          <div className="settings-section">
            <h3 className="section-title">ESP32 裝置設定</h3>

            <div className="setting-item">
              <div className="setting-info">
                <Wifi size={18} />
                <span className="setting-label">ESP32 IP 位址</span>
                <span className="setting-desc">裝置的區域網路位址</span>
              </div>
              <div className="setting-control">
                <input type="text" className="setting-input" value={esp32Settings.ip}
                  onChange={e => setEsp32Settings({ ...esp32Settings, ip: e.target.value })} placeholder="192.168.0.101" />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">連接埠</span>
                <span className="setting-desc">通訊埠號</span>
              </div>
              <div className="setting-control">
                <input type="number" className="setting-input small" value={esp32Settings.port}
                  onChange={e => setEsp32Settings({ ...esp32Settings, port: e.target.value })} min={1} max={65535} />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">安裝位置</span>
                <span className="setting-desc">裝置安裝的場所</span>
              </div>
              <div className="setting-control">
                <select className="setting-select" value={esp32Settings.location}
                  onChange={e => setEsp32Settings({ ...esp32Settings, location: e.target.value })}>
                  <option value="浴室">浴室</option>
                  <option value="臥室">臥室</option>
                  <option value="客廳">客廳</option>
                  <option value="廚房">廚房</option>
                  <option value="走廊">走廊</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">跌倒偵測靈敏度</span>
                <span className="setting-desc">調整跌倒偵測的靈敏度</span>
              </div>
              <div className="setting-control sensitivity-control">
                <input type="range" min={10} max={100} step={5} value={esp32Settings.sensitivity}
                  onChange={e => setEsp32Settings({ ...esp32Settings, sensitivity: Number(e.target.value) })}
                  className="sensitivity-slider" />
                <span className="sensitivity-value">{esp32Settings.sensitivity}%</span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">自動連線</span>
                <span className="setting-desc">啟動時自動連接裝置</span>
              </div>
              <div className="setting-control">
                <label className="switch">
                  <input type="checkbox" checked={esp32Settings.autoConnect}
                    onChange={e => setEsp32Settings({ ...esp32Settings, autoConnect: e.target.checked })} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">輪詢間隔</span>
                <span className="setting-desc">資料擷取頻率</span>
              </div>
              <div className="setting-control">
                <select className="setting-select" value={esp32Settings.pollingInterval}
                  onChange={e => setEsp32Settings({ ...esp32Settings, pollingInterval: Number(e.target.value) })}>
                  <option value={1000}>1 秒</option>
                  <option value={2000}>2 秒</option>
                  <option value={5000}>5 秒</option>
                  <option value={10000}>10 秒</option>
                </select>
              </div>
            </div>

            <button className={`btn btn-outline test-btn ${testingConnection ? 'testing' : ''}`}
              onClick={handleTestConnection} disabled={testingConnection}>
              {testingConnection ? <Loader2 size={18} className="spin" /> : <Wifi size={18} />}
              {testingConnection ? '測試中...' : '測試連線'}
            </button>

            {testResult && (
              <div className={`test-result ${testResult.ok ? 'success' : 'error'}`}>
                {testResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>
        );

      case 'account':
        return (
          <div className="settings-section">
            <h3 className="section-title">帳號設定</h3>

            <div className="account-card">
              <div className="account-avatar">{accountForm.displayName.charAt(0) || '?'}</div>
              <div className="account-info">
                <h4>{accountForm.displayName || '未設定名稱'}</h4>
                <span className="account-role-badge">{accountForm.role || 'user'}</span>
                <span>{accountForm.email || accountForm.username}</span>
              </div>
              <button className="btn btn-outline"
                onClick={() => setAccountForm({ ...accountForm, isEditing: !accountForm.isEditing })}>
                {accountForm.isEditing ? '取消' : '編輯資料'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">帳號名稱</span>
                <span className="setting-desc">登入時使用的帳號（不可更改）</span>
              </div>
              <div className="setting-control">
                <input type="text" className="setting-input" value={accountForm.username} readOnly />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">顯示名稱</span>
              </div>
              <div className="setting-control">
                <input type="text" className="setting-input" value={accountForm.displayName}
                  onChange={e => setAccountForm({ ...accountForm, displayName: e.target.value })}
                  readOnly={!accountForm.isEditing} />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Mail size={16} />
                <span className="setting-label">電子郵件</span>
              </div>
              <div className="setting-control">
                <input type="email" className="setting-input" value={accountForm.email}
                  onChange={e => setAccountForm({ ...accountForm, email: e.target.value })}
                  readOnly={!accountForm.isEditing} />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <Smartphone size={16} />
                <span className="setting-label">電話號碼</span>
              </div>
              <div className="setting-control">
                <input type="tel" className="setting-input" value={accountForm.phone}
                  onChange={e => setAccountForm({ ...accountForm, phone: e.target.value })}
                  readOnly={!accountForm.isEditing} placeholder="0912-345-678" />
              </div>
            </div>

            {accountForm.isEditing && (
              <button className="btn btn-primary save-account-btn" onClick={handleSaveAccount} disabled={isSavingAccount}>
                {isSavingAccount ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                {isSavingAccount ? '儲存中...' : '儲存變更'}
              </button>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="settings-section">
            <h3 className="section-title">資料管理</h3>

            <div className="setting-item clickable" onClick={() => setShowExportModal(true)}>
              <div className="setting-info">
                <Download size={18} />
                <span className="setting-label">匯出資料</span>
                <span className="setting-desc">下載事件記錄與統計資料</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable" onClick={() => showToast('系統每 24 小時自動備份至 SQLite 資料庫', 'info')}>
              <div className="setting-info">
                <RotateCcw size={18} />
                <span className="setting-label">備份設定</span>
                <span className="setting-desc">自動備份到 SQLite 資料庫</span>
              </div>
              <div className="setting-status enabled">自動</div>
            </div>

            <div className="setting-group">
              <h4 className="group-title">危險操作</h4>

              <div className="setting-item clickable danger" onClick={() => setShowClearCacheModal(true)}>
                <div className="setting-info">
                  <AlertTriangle size={18} />
                  <span className="setting-label">清除快取</span>
                  <span className="setting-desc">清除所有本機暫存資料</span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>

              <div className="setting-item clickable danger" onClick={() => setShowResetModal(true)}>
                <div className="setting-info">
                  <AlertTriangle size={18} />
                  <span className="setting-label">重置設定</span>
                  <span className="setting-desc">還原所有設定為預設值</span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ========================================
  // 主 JSX
  // ========================================
  return (
    <div className="page-content settings-page">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">
          <Settings className="page-title-icon" />
          系統設定
        </h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
          {isSaving ? '儲存中...' : '儲存設定'}
        </button>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {SETTING_SECTIONS.map(section => (
            <button key={section.id} className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}>
              {section.icon}
              <span>{section.title}</span>
              <ChevronRight size={16} className="chevron" />
            </button>
          ))}
        </div>

        <div className="settings-content">
          {renderSection()}
        </div>
      </div>

      {/* Modal: 變更密碼 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title"><Lock size={24} />變更密碼</h2>
            <form className="modal-form" onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>目前密碼</label>
                <div className="input-with-eye">
                  <input type={showCurrentPwd ? 'text' : 'password'} placeholder="請輸入目前密碼"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                  <button type="button" className="eye-btn" onClick={() => setShowCurrentPwd(!showCurrentPwd)}>
                    {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>新密碼</label>
                <div className="input-with-eye">
                  <input type={showNewPwd ? 'text' : 'password'} placeholder="至少 6 個字元"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
                  <button type="button" className="eye-btn" onClick={() => setShowNewPwd(!showNewPwd)}>
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div className={`password-strength ${passwordForm.newPassword.length >= 8 ? 'strong' : passwordForm.newPassword.length >= 6 ? 'medium' : 'weak'}`}>
                    強度：{passwordForm.newPassword.length >= 8 ? '強' : passwordForm.newPassword.length >= 6 ? '中' : '弱'}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>確認新密碼</label>
                <input type="password" placeholder="再次輸入新密碼"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <div className="field-error">密碼不一致</div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary"
                  disabled={passwordLoading || passwordForm.newPassword !== passwordForm.confirmPassword}>
                  {passwordLoading ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
                  {passwordLoading ? '變更中...' : '確認變更'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: 登入紀錄 */}
      {showLoginHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowLoginHistoryModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title"><Clock size={24} />登入紀錄</h2>
            <div className="login-history-list">
              {loginHistory.map((record, index) => (
                <div key={index} className={`history-item ${record.status === '失敗' ? 'failed' : ''}`}>
                  <div className="history-date">{record.date}</div>
                  <div className="history-device">{record.device}</div>
                  <div className="history-ip">{record.ip}</div>
                  <div className={`history-status ${record.status === '成功' ? 'success' : 'failed'}`}>
                    {record.status === '成功' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {record.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowLoginHistoryModal(false)}>關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 匯出資料 */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title"><Download size={24} />匯出資料</h2>
            <p className="modal-description">選擇匯出格式，系統將自動下載包含統計與事件的檔案。</p>
            <div className="export-options">
              <button className="export-btn" onClick={() => handleExportData('json')} disabled={isExporting}>
                <Database size={20} />
                <span>JSON 格式</span>
                <small>包含完整資料</small>
              </button>
              <button className="export-btn" onClick={() => handleExportData('csv')} disabled={isExporting}>
                <Download size={20} />
                <span>CSV 格式</span>
                <small>適用 Excel 開啟</small>
              </button>
            </div>
            {isExporting && (
              <div className="export-loading">
                <Loader2 size={20} className="spin" />
                <span>匯出中，請稍候...</span>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowExportModal(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 清除快取確認 */}
      {showClearCacheModal && (
        <div className="modal-overlay" onClick={() => setShowClearCacheModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title"><AlertTriangle size={24} />確認清除快取</h2>
            <p className="delete-message">確定要清除所有本機快取嗎？清除後本機設定、暫存資料都將被移除，但登入狀態會保留。</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowClearCacheModal(false)}>取消</button>
              <button type="button" className="btn btn-danger" onClick={handleClearCache}>確認清除</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 重置設定確認 */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title"><AlertTriangle size={24} />確認重置</h2>
            <p className="delete-message">
              確定要還原所有設定嗎？所有設定將恢復為預設值。<br />
              <strong>注意：此操作無法還原。</strong>
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowResetModal(false)}>取消</button>
              <button type="button" className="btn btn-danger" onClick={handleReset}>確認重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

