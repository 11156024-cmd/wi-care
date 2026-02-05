import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Clock, 
  Plug,
  PhoneOutgoing,
  FileHeart,
  Cpu,
  Zap,
  BarChart2,
  UserCircle,
  AlertTriangle,
  Shield,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Monitor,
  BookHeart,
  Users,
  Settings,
  Bell,
  RotateCcw,
  LogIn
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

import { SystemStatus, DashboardStats, SceneMode, RegistrationData } from './WiCare.Types';
import { fetchDeviceStatus, isESP32Connected, getESP32ConnectionStatus, checkESP32Health } from './services/WiCare.ESP32Api';
import { audioService } from './services/WiCare.AudioService';
import { lineService } from './services/WiCare.LineService';
import { esp32Service } from './services/WiCare.ESP32Service';
import StatusVisual from './components/WiCare.StatusVisual';
import AlertOverlay from './components/WiCare.AlertOverlay';
import HiddenControls from './components/WiCare.HiddenControls';
import WaveformMonitor from './components/WiCare.WaveformMonitor';
import SettingsModal from './components/WiCare.SettingsModal';
import CaregiverProfileView from './components/WiCare.CaregiverProfileView';
import ElderlyHealthPassport from './components/WiCare.ElderlyHealthPassport';
import DeviceSetupView from './components/WiCare.DeviceSetupView';
import RegistrationModal from './components/WiCare.RegistrationModal';
import ESP32SettingsModal from './components/WiCare.ESP32SettingsModal';
import LoginModal from './components/WiCare.LoginModal';

// Mock Data for Charts
const ACTIVITY_DATA = [
  { time: '08:00', value: 10 },
  { time: '10:00', value: 45 },
  { time: '12:00', value: 30 },
  { time: '14:00', value: 15 },
  { time: '16:00', value: 60 },
  { time: '18:00', value: 20 },
];

const App: React.FC = () => {
  // --- State (Model) ---
  const [status, setStatus] = useState<SystemStatus>(SystemStatus.SAFE);
  const [isOffline, setIsOffline] = useState<boolean>(true); 
  const [esp32Connected, setEsp32Connected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showHealthPassport, setShowHealthPassport] = useState<boolean>(false);
  const [showDeviceSetup, setShowDeviceSetup] = useState<boolean>(false);
  const [showRegistration, setShowRegistration] = useState<boolean>(false);
  const [showESP32Settings, setShowESP32Settings] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sceneMode, setSceneMode] = useState<SceneMode>('bathroom');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deviceId, setDeviceId] = useState<string>('Wi-Care-Station-01');
  
  const [stats, setStats] = useState<DashboardStats>({
    lastActivity: '剛剛',
    activityHours: 4.5
  });
  
  // Track if we have already notified for the current fall event to avoid spam
  const hasNotifiedRef = useRef<boolean>(false);

  // --- ViewModel Logic ---

  // 初始化 ESP32 連線
  useEffect(() => {
    const initializeESP32 = async () => {
      try {
        console.log('[App] 正在初始化 ESP32 連線...');
        
        // 先檢查健康狀態
        const isHealthy = await checkESP32Health();
        if (!isHealthy) {
          throw new Error('ESP32 健康檢查失敗');
        }
        
        await esp32Service.connect();
        console.log('[App] ESP32 連線成功');
        setEsp32Connected(true);
        setIsOffline(false);
        setConnectionError(null);
        // 初始設置為綠色（安全狀態）
        await esp32Service.setToSafe();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[App] ESP32 連線失敗:', errorMsg);
        setEsp32Connected(false);
        setIsOffline(true);
        setConnectionError(errorMsg);
        setStatus(SystemStatus.OFFLINE);
      }
    };

    initializeESP32();

    // 清理：組件卸載時斷開連線
    return () => {
      esp32Service.disconnect();
    };
  }, []);

  // 從 ESP32 獲取實時狀態 - 更新連線狀態
  const fetchData = useCallback(async () => {
    try {
      const result = await fetchDeviceStatus(false);
      
      // 真實 ESP32 狀態
      const newStatus = result.status === 'fall' ? SystemStatus.FALL : SystemStatus.SAFE;
      setStatus(newStatus);
      setIsOffline(false);
      setEsp32Connected(true);
      setConnectionError(null);
      
      console.log('[App] ESP32 狀態:', result.status, '| 設備:', result.device_id);
    } catch (error) {
      // ESP32 連線失敗 - 顯示離線但不使用模擬狀態
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[App] 從 ESP32 獲取狀態錯誤:', errorMsg);
      
      setIsOffline(true);
      setEsp32Connected(false);
      setConnectionError(errorMsg);
      setStatus(SystemStatus.OFFLINE);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(fetchData, 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Handle Status Changes & Notifications
  useEffect(() => {
    if (status === SystemStatus.FALL) {
      // 1. Trigger local alarms
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 1000]);
      }
      audioService.playAlarm();

      // 2. Control ESP32 LED - Red with blinking
      esp32Service.triggerEmergencyAlarm().then(success => {
        if (success) {
          console.log('[App] ESP32 緊急警報已觸發');
        } else {
          console.log('[App] ESP32 控制失敗，但繼續本地流程');
        }
      });

      // 3. Send LINE Notification (if not already sent for this event)
      if (!hasNotifiedRef.current) {
        console.log('Fall detected. Attempting to send LINE notification...');
        lineService.sendFallAlert().then(success => {
            if (success) console.log('LINE notification simulated success.');
        });
        hasNotifiedRef.current = true;
      }
    } else {
      // Reset alarm and notification flag when status returns to SAFE
      audioService.stopAlarm();
      if (status === SystemStatus.SAFE) {
        hasNotifiedRef.current = false;
        // 設置 ESP32 狀態為綠色
        esp32Service.setToSafe().then(success => {
          if (success) {
            console.log('[App] ESP32 已設置為安全狀態');
          }
        });
      }
    }
  }, [status]);

  // 測試功能（開發用）直接觸發 ESP32
  const handleForceSafe = async () => {
    try {
      // 調用真實 ESP32 API 清除跌倒狀態
      const { clearESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await clearESP32FallDetection();
      console.log('[App] 已通知 ESP32 清除跌倒狀態');
    } catch (error) {
      console.error('[App] 無法清除跌倒狀態:', error);
      alert('無法連接 ESP32 來清除狀態');
    }
  };

  const handleForceFall = async () => {
    try {
      // 調用真實 ESP32 API 觸發跌倒
      const { triggerESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await triggerESP32FallDetection();
      console.log('[App] 已通知 ESP32 觸發跌倒');
    } catch (error) {
      console.error('[App] 無法觸發跌倒:', error);
      alert('無法連接 ESP32 來觸發跌倒');
    }
  };

  const handleDismissAlert = async () => {
    try {
      const { clearESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await clearESP32FallDetection();
      audioService.stopAlarm();
      console.log('[App] 警報已解除');
    } catch (error) {
      console.error('[App] 無法解除警報:', error);
      // 仍然停止本地警報
      audioService.stopAlarm();
    }
  };

  const handleCallFamilyRequest = () => {
    alert("影像已儲存。正在撥打緊急聯絡人: 1 234 567 890");
  };

  const handleLogin = (username: string, name: string, role: string) => {
    setIsLoggedIn(true);
    setCurrentUser(name);
    console.log(`[App] 使用者 ${name} (${username}) 已登入，角色: ${role}`);
  };

  const handleLogout = async () => {
    try {
      const { authApi } = await import('./services/WiCare.ApiService');
      await authApi.logout();
    } catch (error) {
      console.error('[App] 登出失敗:', error);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    console.log('[App] 使用者已登出');
  };

  const handleManualSOS = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    try {
      // 觸發 ESP32 跌倒警報
      const { triggerESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await triggerESP32FallDetection();
      
      // Also trigger LINE for manual SOS
      lineService.sendFallAlert();
      alert("已觸發緊急呼叫！正在通知家庭成員並建立通話...");
    } catch (error) {
      console.error('[App] 觸發 SOS 失敗:', error);
      // 即使 ESP32 失敗，仍然發送 LINE 通知
      lineService.sendFallAlert();
      alert("已發送緊急通知（ESP32 連線失敗，但 LINE 通知已發送）");
    }
  };

  const handleRegistration = (data: RegistrationData) => {
    console.log('Registration submitted:', data);
    // Here you would typically send the data to your backend API
    // For now, we'll just log it and show a success message
    alert(`歡迎 ${data.name}! 您的帳號已成功建立。`);
  };

  const handleStatusUpdate = (newStatus: SystemStatus) => {
    setStatus(newStatus);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header with Clear Navigation */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white shadow-sm z-50">
        <div className="header-container">
          {/* Logo */}
          <div className="header-logo">
            <div className="logo-icon">
              <span>W</span>
            </div>
            <div className="logo-text">
              <span className="logo-title">WI-CARE</span>
              <span className="logo-subtitle">智慧長照系統</span>
            </div>
          </div>
          
          {/* Main Navigation */}
          <nav className="header-nav">
            <button className="nav-item active">
              <Monitor className="nav-icon" />
              <span>即時監控</span>
            </button>
            <button className="nav-item" onClick={() => setShowHealthPassport(true)}>
              <BookHeart className="nav-icon" />
              <span>個人檔案</span>
            </button>
            <button className="nav-item" onClick={() => setShowProfile(true)}>
              <Users className="nav-icon" />
              <span>護理人員</span>
            </button>
            <button className="nav-item" onClick={() => setShowDeviceSetup(true)}>
              <Cpu className="nav-icon" />
              <span>設備管理</span>
            </button>
            <button className="nav-item" onClick={() => setShowRegistration(true)}>
              <Settings className="nav-icon" />
              <span>系統設定</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="header-actions">
            {/* Connection Status */}
            <div className="connection-status">
              {esp32Connected ? (
                <span className="status-dot online"></span>
              ) : (
                <span className="status-dot offline"></span>
              )}
              <span className="status-text">{esp32Connected ? '已連線' : '離線'}</span>
            </div>
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <button onClick={handleForceFall} className="action-btn warning" title="模擬跌倒警報">
                <Bell className="action-icon" />
              </button>
              <button onClick={handleForceSafe} className="action-btn success" title="重置系統狀態">
                <RotateCcw className="action-icon" />
              </button>
            </div>
            
            <div className="header-divider"></div>
            
            {isLoggedIn ? (
              <div className="user-menu">
                <span className="user-name">{currentUser}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  登出
                </button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowLogin(true)}>
                <LogIn className="login-icon" />
                <span>登入</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals and Overlays */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />
      <RegistrationModal 
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onRegister={handleRegistration}
      />
      <CaregiverProfileView 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
      <ElderlyHealthPassport 
        isOpen={showHealthPassport}
        onClose={() => setShowHealthPassport(false)}
      />
      <DeviceSetupView 
        isOpen={showDeviceSetup}
        onClose={() => setShowDeviceSetup(false)}
        onOpenESP32Settings={() => setShowESP32Settings(true)}
      />
      <ESP32SettingsModal 
        isOpen={showESP32Settings}
        onClose={() => setShowESP32Settings(false)}
        onSettingsSaved={() => console.log('ESP32 設置已儲存')}
      />
      <AlertOverlay 
        isVisible={status === SystemStatus.FALL} 
        onDismiss={handleDismissAlert}
        onCall={handleCallFamilyRequest}
      />
      {showDevTools && (
        <HiddenControls 
          onStatusChange={handleStatusUpdate} 
          onClose={() => setShowDevTools(false)} 
          esp32Connected={esp32Connected}
          connectionError={connectionError}
        />
      )}

      {/* Hero Banner Section */}
      <section className="mt-20 hero-banner">
        <div className="hero-content grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left animate-in fade-in slide-in-from-left-8 duration-700">
            <div className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-black uppercase tracking-[3px] mb-6 ${status === SystemStatus.SAFE ? 'bg-emerald-50 text-[#006241]' : 'bg-red-50 text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${status === SystemStatus.SAFE ? 'bg-[#006241] animate-pulse' : 'bg-red-500'}`}></span>
              {status === SystemStatus.SAFE ? '系統運行正常' : '偵測到緊急狀況'}
            </div>
            <h1 className="hero-title">
              {status === SystemStatus.SAFE ? '全天候溫暖守護，' : '緊急呼救中，'} <br />
              <span className="text-[#006241]">讓長照更貼近生活。</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
              透過高精準度毫米波與波形分析技術，我們為每一位長者提供最細緻的照護監控。當意外發生時，系統將在第一時間通知您。
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowHealthPassport(true)}
                className="bg-[#006241] text-white px-8 py-3 rounded-full font-bold hover:bg-[#1e3932] transition-all shadow-xl shadow-[#006241]/20"
              >
                查看長者紀錄庫
              </button>
              <button 
                onClick={() => setShowESP32Settings(true)}
                className="btn-outline btn-outline-dark px-8 py-3"
              >
                調整監控參數
              </button>
            </div>
          </div>
          
          <div className="relative animate-in fade-in zoom-in-95 duration-1000">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <Activity className="w-5 h-5 text-[#006241]" />
                  </div>
                  <span className="font-bold text-slate-800">即時動態追蹤</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LIVE DATA FEED</span>
              </div>
              <div className="h-64 bg-slate-50/50 rounded-3xl p-4">
                <WaveformMonitor isOffline={isOffline} />
              </div>
              <div className="mt-6 flex justify-around">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">活躍度</div>
                  <div className="text-xl font-bold text-slate-900">85%</div>
                </div>
                <div className="w-px h-8 bg-slate-100 mt-2"></div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">連線狀態</div>
                  <div className={`text-xl font-bold ${esp32Connected ? 'text-[#006241]' : 'text-red-500'}`}>
                    {esp32Connected ? 'STABLE' : 'OFFLINE'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-[1440px] mx-auto px-10 py-24 space-y-32">
        {/* Section 1: Dashboard Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-16 text-left">
          <div className="space-y-4 group">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#006241] group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">最後活動時間</h3>
            <p className="text-5xl font-extrabold text-[#006241] tracking-tighter">{stats.lastActivity}</p>
            <p className="text-slate-500">系統精確紀錄長者的每一次顯著肢體活動，確保作息正常。</p>
          </div>

          <div className="space-y-4 group">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">本日累計活動小時</h3>
            <p className="text-5xl font-extrabold text-blue-600 tracking-tighter">{stats.activityHours}H</p>
            <p className="text-slate-500">協助護理人員評估長者是否有過度臥床或活動量不足的問題。</p>
          </div>

          <div className="space-y-4 group">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">系統安全防護等級</h3>
            <p className="text-5xl font-extrabold text-orange-600 tracking-tighter">99.9%</p>
            <p className="text-slate-500">基於邊緣計算的高穩定度，即便網路斷連也能維持基本監控功能。</p>
          </div>
        </section>

        {/* Section 2: Detailed Chart & Action */}
        <section className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="flex-1 w-full bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">24H 活動分佈分析</h3>
                <p className="text-slate-500">Long-term activity distribution report</p>
              </div>
              <div className="flex gap-2">
                <button className="px-5 py-2 bg-[#006241] text-white rounded-full text-xs font-bold">本日趨勢</button>
                <button className="px-5 py-2 border border-slate-200 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors">歷史紀錄</button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ACTIVITY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}}
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f8f6', radius: 8}}
                    contentStyle={{
                      background: '#ffffff',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                    {ACTIVITY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? '#006241' : '#e0e0e0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-8">
            <div className="bg-[#1e3932] p-10 rounded-[40px] text-white">
              <h4 className="text-xl font-bold mb-4">緊急聯絡通道</h4>
              <p className="text-emerald-100/70 text-sm mb-8">當系統偵測異常時，可快速啟動語音通話或 LINE 通知。</p>
              <button 
                onClick={handleManualSOS}
                className="w-full bg-[#d50032] hover:bg-red-700 text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-3"
              >
                <PhoneOutgoing className="w-5 h-5" />
                立即撥打緊急電話
              </button>
              <p className="text-center mt-6 text-[10px] uppercase font-bold tracking-widest text-emerald-100/40">Secured Nursing Line</p>
            </div>

            <div className="pro-card p-10 bg-white group cursor-pointer hover:border-[#006241] transition-all">
              <div className="flex items-center gap-5 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#f1f8f6] flex items-center justify-center text-[#006241]">
                  <FileHeart className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800">照護紀錄日誌</h4>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">檢視長者最近的健康異常紀錄與照護備註，確保交班資訊完整。</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e3932] text-white py-20 px-10">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#006241] font-black text-xl">W</span>
              </div>
              <span className="text-xl font-bold tracking-tight">WI-CARE</span>
            </div>
            <p className="text-emerald-100/50 max-w-sm text-sm">
              我們致力於利用前端物聯網與毫米波感測技術，提升長照機構的服務品質，保障長者的居家與安養安全。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-20">
            <div className="space-y-4 text-sm">
              <h5 className="font-bold text-white uppercase tracking-widest text-xs">關於我們</h5>
              <p className="text-emerald-100/50 cursor-pointer">隱私政策</p>
              <p className="text-emerald-100/50 cursor-pointer">服務條款</p>
            </div>
            <div className="space-y-4 text-sm">
              <h5 className="font-bold text-white uppercase tracking-widest text-xs">技術支援</h5>
              <p className="text-emerald-100/50 cursor-pointer">常見問題</p>
              <p className="text-emerald-100/50 cursor-pointer">API 說明文件</p>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-20 pt-10 border-t border-white/10 text-[10px] text-emerald-100/20 font-bold uppercase tracking-[2px]">
          © 2026 WI-CARE ELDERLY TECH. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
};

export default App;
