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
  Check,
  Upload,
  Download
} from 'lucide-react';
import FolderUpload from '../components/WiCare.FolderUpload';

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            
            <div className="setting-item clickable">
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

            <div className="setting-item clickable">
              <div className="setting-info">
                <Clock size={18} />
                <span className="setting-label">登入紀錄</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable">
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

            <button className="btn btn-outline test-btn">
              <Wifi size={18} />
              測試連線
            </button>
          </div>
        );

      case 'account':
        return (
          <div className="settings-section">
            <h3 className="section-title">帳號設定</h3>
            
            <div className="account-card">
              <div className="account-avatar">A</div>
              <div className="account-info">
                <h4>Admin</h4>
                <span>admin@wicare.com</span>
              </div>
              <button className="btn btn-outline">編輯資料</button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">顯示名稱</span>
              </div>
              <div className="setting-control">
                <input type="text" className="setting-input" value="Admin" readOnly />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">電子郵件</span>
              </div>
              <div className="setting-control">
                <input type="email" className="setting-input" value="admin@wicare.com" readOnly />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">電話</span>
              </div>
              <div className="setting-control">
                <input type="tel" className="setting-input" value="0912-345-678" readOnly />
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="settings-section">
            <h3 className="section-title">資料管理</h3>
            
            {/* Folder Upload Section */}
            <div className="data-upload-section">
              <h4 className="subsection-title">
                <Upload size={18} />
                上傳資料夾
              </h4>
              <p className="subsection-desc">
                您可以上傳包含健康記錄、文件或其他資料的完整資料夾
              </p>
              <div className="folder-upload-wrapper">
                <FolderUpload
                  onUploadComplete={(files) => {
                    console.log('Upload complete:', files);
                    alert(`成功上傳 ${files.length} 個檔案！`);
                  }}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    alert(`上傳失敗: ${error}`);
                  }}
                  maxFileSize={10 * 1024 * 1024} // 10MB per file
                />
              </div>
            </div>

            <div className="divider"></div>

            <div className="setting-item clickable">
              <div className="setting-info">
                <Download size={18} />
                <span className="setting-label">匯出資料</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable">
              <div className="setting-info">
                <RotateCcw size={18} />
                <span className="setting-label">備份設定</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable danger">
              <div className="setting-info">
                <AlertTriangle size={18} />
                <span className="setting-label">清除快取</span>
              </div>
              <ChevronRight size={18} className="chevron" />
            </div>

            <div className="setting-item clickable danger">
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
    </div>
  );
};

export default SettingsPage;
