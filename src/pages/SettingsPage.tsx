import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SETTING_SECTIONS: SettingSection[] = [
  { id: 'general', title: '一般設定', icon: <Settings size={20} /> },
  { id: 'notifications', title: '通知設定', icon: <Bell size={20} /> },
  { id: 'security', title: '安全性', icon: <Shield size={20} /> },
  { id: 'device', title: '設備設定', icon: <Wifi size={20} /> },
  { id: 'account', title: '帳號設定', icon: <User size={20} /> },
  { id: 'data', title: '資料管理', icon: <Database size={20} /> }
];

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState({
    fallAlert: true,
    healthReminder: true,
    systemUpdate: false,
    email: true,
    sms: true,
    line: true
  });
  const [esp32Settings, setEsp32Settings] = useState({
    ip: '192.168.0.101',
    port: '80',
    autoConnect: true,
    pollingInterval: 2000
  });
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [accountForm, setAccountForm] = useState({
    displayName: 'Admin',
    email: 'admin@wicare.com',
    phone: '0912-345-678',
    isEditing: false
  });

  // 模擬登入記錄
  const loginHistory = [
    { date: '2026-02-05 09:15:32', device: 'Chrome / Windows', ip: '192.168.0.100', status: '成功' },
    { date: '2026-02-04 14:23:18', device: 'Safari / macOS', ip: '192.168.0.105', status: '成功' },
    { date: '2026-02-03 08:45:01', device: 'Chrome / Android', ip: '192.168.0.112', status: '成功' },
    { date: '2026-02-02 22:10:55', device: 'Firefox / Windows', ip: '192.168.0.100', status: '失敗' },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    alert('設定已儲存！');
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingConnection(false);
    alert(`連線測試完成！\nIP: ${esp32Settings.ip}\n埠號: ${esp32Settings.port}\n狀態: 連線成功`);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('新密碼與確認密碼不符！');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('新密碼長度至少需要 6 個字元！');
      return;
    }
    alert('密碼已成功變更！');
    setShowPasswordModal(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleExportData = (format: string) => {
    alert(`正在匯出 ${format.toUpperCase()} 格式的資料...`);
    setShowExportModal(false);
  };

  const handleClearCache = () => {
    alert('快取已清除！');
    setShowClearCacheModal(false);
  };

  const handleReset = () => {
    alert('所有設定已重置為預設值！');
    setShowResetModal(false);
    // 重置所有設定
    setIsDarkMode(false);
    setSoundEnabled(true);
    setNotifications({
      fallAlert: true,
      healthReminder: true,
      systemUpdate: false,
      email: true,
      sms: true,
      line: true
    });
    setEsp32Settings({
      ip: '192.168.0.101',
      port: '80',
      autoConnect: true,
      pollingInterval: 2000
    });
  };

  const handleSaveAccount = () => {
    setAccountForm({...accountForm, isEditing: false});
    alert('帳號資料已更新！');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="settings-section">
            <h3 className="section-title">一般設定</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">深色模式</span>
                <span className="setting-desc">切換介面顏色主題</span>
              </div>
              <div className="setting-control">
                <button 
                  className={`toggle-btn ${isDarkMode ? 'active' : ''}`}
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                  <span>{isDarkMode ? '深色' : '淺色'}</span>
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">音效</span>
                <span className="setting-desc">啟用或停用系統音效</span>
              </div>
              <div className="setting-control">
                <button 
                  className={`toggle-btn ${soundEnabled ? 'active' : ''}`}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  <span>{soundEnabled ? '開啟' : '關閉'}</span>
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">語言</span>
                <span className="setting-desc">選擇系統顯示語言</span>
              </div>
              <div className="setting-control">
                <select className="setting-select">
                  <option value="zh-TW">繁體中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">時區</span>
                <span className="setting-desc">選擇您的時區</span>
              </div>
              <div className="setting-control">
                <select className="setting-select">
                  <option value="Asia/Taipei">台北 (GMT+8)</option>
                  <option value="Asia/Tokyo">東京 (GMT+9)</option>
                  <option value="America/New_York">紐約 (GMT-5)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <h3 className="section-title">通知設定</h3>
            
            <div className="setting-group">
              <h4 className="group-title">事件通知</h4>
              
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">跌倒警報</span>
                  <span className="setting-desc">偵測到跌倒時發送通知</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.fallAlert}
                      onChange={(e) => setNotifications({...notifications, fallAlert: e.target.checked})}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">健康提醒</span>
                  <span className="setting-desc">用藥提醒及健康檢查通知</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.healthReminder}
                      onChange={(e) => setNotifications({...notifications, healthReminder: e.target.checked})}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">系統更新</span>
                  <span className="setting-desc">有新版本時通知</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.systemUpdate}
                      onChange={(e) => setNotifications({...notifications, systemUpdate: e.target.checked})}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="setting-group">
              <h4 className="group-title">通知管道</h4>
              
              <div className="setting-item">
                <div className="setting-info">
                  <Mail size={18} />
                  <span className="setting-label">電子郵件</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.email}
                      onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <Smartphone size={18} />
                  <span className="setting-label">簡訊</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.sms}
                      onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="line-icon">L</span>
                  <span className="setting-label">LINE 通知</span>
                </div>
                <div className="setting-control">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.line}
                      onChange={(e) => setNotifications({...notifications, line: e.target.checked})}
                    />
                    <span className="slider"></span>
                  </label>
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
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable">
              <div className="setting-info">
                <Shield size={18} />
                <span className="setting-label">兩步驟驗證</span>
              </div>
              <div className="setting-status enabled">已啟用</div>
            </div>

            <div className="setting-item clickable" onClick={() => setShowLoginHistoryModal(true)}>
              <div className="setting-info">
                <Clock size={18} />
                <span className="setting-label">登入紀錄</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable" onClick={() => alert('安全警報設定：目前已啟用異常登入通知')}>
              <div className="setting-info">
                <AlertTriangle size={18} />
                <span className="setting-label">安全警報</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>
          </div>
        );

      case 'device':
        return (
          <div className="settings-section">
            <h3 className="section-title">ESP32 設備設定</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">ESP32 IP 位址</span>
                <span className="setting-desc">設備的網路位址</span>
              </div>
              <div className="setting-control">
                <input 
                  type="text" 
                  className="setting-input"
                  value={esp32Settings.ip}
                  onChange={(e) => setEsp32Settings({...esp32Settings, ip: e.target.value})}
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">連接埠</span>
                <span className="setting-desc">通訊埠號</span>
              </div>
              <div className="setting-control">
                <input 
                  type="text" 
                  className="setting-input small"
                  value={esp32Settings.port}
                  onChange={(e) => setEsp32Settings({...esp32Settings, port: e.target.value})}
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">自動連線</span>
                <span className="setting-desc">啟動時自動連接設備</span>
              </div>
              <div className="setting-control">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={esp32Settings.autoConnect}
                    onChange={(e) => setEsp32Settings({...esp32Settings, autoConnect: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">輪詢間隔</span>
                <span className="setting-desc">狀態更新頻率 (毫秒)</span>
              </div>
              <div className="setting-control">
                <select 
                  className="setting-select"
                  value={esp32Settings.pollingInterval}
                  onChange={(e) => setEsp32Settings({...esp32Settings, pollingInterval: Number(e.target.value)})}
                >
                  <option value={1000}>1000 ms</option>
                  <option value={2000}>2000 ms</option>
                  <option value={5000}>5000 ms</option>
                  <option value={10000}>10000 ms</option>
                </select>
              </div>
            </div>

            <button 
              className={`btn btn-outline test-btn ${testingConnection ? 'testing' : ''}`}
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              <Wifi size={18} className={testingConnection ? 'spin' : ''} />
              {testingConnection ? '測試中...' : '測試連線'}
            </button>
          </div>
        );

      case 'account':
        return (
          <div className="settings-section">
            <h3 className="section-title">帳號設定</h3>
            
            <div className="account-card">
              <div className="account-avatar">{accountForm.displayName.charAt(0)}</div>
              <div className="account-info">
                <h4>{accountForm.displayName}</h4>
                <span>{accountForm.email}</span>
              </div>
              <button 
                className="btn btn-outline"
                onClick={() => setAccountForm({...accountForm, isEditing: !accountForm.isEditing})}
              >
                {accountForm.isEditing ? '取消' : '編輯資料'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">顯示名稱</span>
              </div>
              <div className="setting-control">
                <input 
                  type="text" 
                  className="setting-input" 
                  value={accountForm.displayName}
                  onChange={(e) => setAccountForm({...accountForm, displayName: e.target.value})}
                  readOnly={!accountForm.isEditing}
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">電子郵件</span>
              </div>
              <div className="setting-control">
                <input 
                  type="email" 
                  className="setting-input" 
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                  readOnly={!accountForm.isEditing}
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">電話</span>
              </div>
              <div className="setting-control">
                <input 
                  type="tel" 
                  className="setting-input" 
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({...accountForm, phone: e.target.value})}
                  readOnly={!accountForm.isEditing}
                />
              </div>
            </div>

            {accountForm.isEditing && (
              <button className="btn btn-primary save-account-btn" onClick={handleSaveAccount}>
                <Save size={18} />
                儲存變更
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
                <Database size={18} />
                <span className="setting-label">匯出資料</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable" onClick={() => alert('備份設定：系統每日自動備份至雲端')}>
              <div className="setting-info">
                <RotateCcw size={18} />
                <span className="setting-label">備份設定</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable danger" onClick={() => setShowClearCacheModal(true)}>
              <div className="setting-info">
                <AlertTriangle size={18} />
                <span className="setting-label">清除快取</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable danger" onClick={() => setShowResetModal(true)}>
              <div className="setting-info">
                <AlertTriangle size={18} />
                <span className="setting-label">重置所有設定</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-content settings-page">
      <div className="page-header">
        <h1 className="page-title">
          <Settings className="page-title-icon" />
          系統設定
        </h1>
        <button className={`btn btn-primary ${saved ? 'saved' : ''}`} onClick={handleSave}>
          {saved ? <Check size={18} /> : <Save size={18} />}
          {saved ? '已儲存' : '儲存變更'}
        </button>
      </div>

      <div className="settings-layout">
        {/* Settings Sidebar */}
        <div className="settings-sidebar">
          {SETTING_SECTIONS.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon}
              <span>{section.title}</span>
              <ChevronRight size={16} className="chevron" />
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {renderSection()}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Lock size={24} />
              變更密碼
            </h2>
            <form className="modal-form" onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>目前密碼</label>
                <input 
                  type="password" 
                  placeholder="請輸入目前密碼"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>新密碼</label>
                <input 
                  type="password" 
                  placeholder="請輸入新密碼"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>確認新密碼</label>
                <input 
                  type="password" 
                  placeholder="請再次輸入新密碼"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  確認變更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login History Modal */}
      {showLoginHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowLoginHistoryModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Clock size={24} />
              登入紀錄
            </h2>
            <div className="login-history-list">
              {loginHistory.map((record, index) => (
                <div key={index} className={`history-item ${record.status === '失敗' ? 'failed' : ''}`}>
                  <div className="history-date">{record.date}</div>
                  <div className="history-device">{record.device}</div>
                  <div className="history-ip">{record.ip}</div>
                  <div className={`history-status ${record.status === '成功' ? 'success' : 'failed'}`}>
                    {record.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowLoginHistoryModal(false)}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Database size={24} />
              匯出資料
            </h2>
            <p className="modal-description">請選擇匯出格式：</p>
            <div className="export-options">
              <button className="export-btn" onClick={() => handleExportData('json')}>
                JSON 格式
              </button>
              <button className="export-btn" onClick={() => handleExportData('csv')}>
                CSV 格式
              </button>
              <button className="export-btn" onClick={() => handleExportData('pdf')}>
                PDF 報告
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowExportModal(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation */}
      {showClearCacheModal && (
        <div className="modal-overlay" onClick={() => setShowClearCacheModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <AlertTriangle size={24} />
              確認清除快取
            </h2>
            <p className="delete-message">
              確定要清除所有快取資料嗎？這可能會使某些功能暫時變慢。
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowClearCacheModal(false)}>
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleClearCache}>
                確認清除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <AlertTriangle size={24} />
              確認重置
            </h2>
            <p className="delete-message">
              確定要重置所有設定嗎？這將會把所有設定還原為預設值，此操作無法復原。
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowResetModal(false)}>
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleReset}>
                確認重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
