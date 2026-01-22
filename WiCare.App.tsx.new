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
  AlertTriangle
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
  const [isOffline, setIsOffline] = useState<boolean>(true); // ?�設?��??�到確�???��
  const [esp32Connected, setEsp32Connected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showHealthPassport, setShowHealthPassport] = useState<boolean>(false);
  const [showDeviceSetup, setShowDeviceSetup] = useState<boolean>(false);
  const [showRegistration, setShowRegistration] = useState<boolean>(false);
  const [showESP32Settings, setShowESP32Settings] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sceneMode, setSceneMode] = useState<SceneMode>('bathroom');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deviceId, setDeviceId] = useState<string>('Wi-Care-Station-01');
  
  const [stats, setStats] = useState<DashboardStats>({
    lastActivity: '?��?',
    activityHours: 4.5
  });
  
  // Track if we have already notified for the current fall event to avoid spam
  const hasNotifiedRef = useRef<boolean>(false);

  // --- ViewModel Logic ---

  // ?��???ESP32 ??��
  useEffect(() => {
    const initializeESP32 = async () => {
      try {
        console.log('[App] �?��?��???ESP32 ??��...');
        
        // ?�檢?�健康�???        const isHealthy = await checkESP32Health();
        if (!isHealthy) {
          throw new Error('ESP32 ?�康檢查失�?');
        }
        
        await esp32Service.connect();
        console.log('[App] ??ESP32 ??��?��?');
        setEsp32Connected(true);
        setIsOffline(false);
        setConnectionError(null);
        // ?��??�設置為綠色（�??��??��?
        await esp32Service.setToSafe();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[App] ??ESP32 ??��失�?:', errorMsg);
        setEsp32Connected(false);
        setIsOffline(true);
        setConnectionError(errorMsg);
        setStatus(SystemStatus.OFFLINE);
      }
    };

    initializeESP32();

    // 清�?：�??�卸載�??��???��
    return () => {
      esp32Service.disconnect();
    };
  }, []);

  // �?ESP32 ?��??�實?��? - ?��??��??��?
  const fetchData = useCallback(async () => {
    try {
      const result = await fetchDeviceStatus(false);
      
      // ?�實 ESP32 ?��?
      const newStatus = result.status === 'fall' ? SystemStatus.FALL : SystemStatus.SAFE;
      setStatus(newStatus);
      setIsOffline(false);
      setEsp32Connected(true);
      setConnectionError(null);
      
      console.log('[App] ?�� ESP32 ?�??', result.status, '| 設�?:', result.device_id);
    } catch (error) {
      // ESP32 ??��失�? - 顯示?��??�?��?不使?��??��?
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[App] ?��? ESP32 ??��?�誤:', errorMsg);
      
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
          console.log('[App] ESP32 緊急警?�已觸發');
        } else {
          console.log('[App] ESP32 ?�制失�?，�?繼�?�?��流�?');
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
        // 設置 ESP32 ?��??��??��?綠色�?        esp32Service.setToSafe().then(success => {
          if (success) {
            console.log('[App] ESP32 已設置為安全?�??);
          }
        });
      }
    }
  }, [status]);

  // ?��?測試?�能（�??�用�? ?�接觸發 ESP32
  const handleForceSafe = async () => {
    try {
      // 調用?�實 ESP32 API 清除跌倒�???      const { clearESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await clearESP32FallDetection();
      console.log('[App] ?�� 已�?�?ESP32 清除跌倒�???);
    } catch (error) {
      console.error('[App] ???��?清除跌倒�???', error);
      alert('?��???��??ESP32 來�??��???);
    }
  };

  const handleForceFall = async () => {
    try {
      // 調用?�實 ESP32 API 觸發跌�?      const { triggerESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await triggerESP32FallDetection();
      console.log('[App] ?�� 已�?�?ESP32 觸發跌�?);
    } catch (error) {
      console.error('[App] ???��?觸發跌�?', error);
      alert('?��???��??ESP32 來觸?��???);
    }
  };

  const handleDismissAlert = async () => {
    try {
      const { clearESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await clearESP32FallDetection();
      audioService.stopAlarm();
      console.log('[App] ??警報已解??);
    } catch (error) {
      console.error('[App] ???��?�?��警報:', error);
      // ?��??�止?�地警報
      audioService.stopAlarm();
    }
  };

  const handleCallFamilyRequest = () => {
    alert("?��?已儲存。正?�撥?��??�聯絡人�?1 234 567 890");
  };

  const handleManualSOS = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    try {
      // 觸發 ESP32 跌倒警??      const { triggerESP32FallDetection } = await import('./services/WiCare.ESP32Api');
      await triggerESP32FallDetection();
      
      // Also trigger LINE for manual SOS
      lineService.sendFallAlert();
      alert("已觸?��??��??�呼?��?�?��?�知家�??�員並建立通話...");
    } catch (error) {
      console.error('[App] ???��? SOS 失�?:', error);
      // ?�使 ESP32 失�?，�??�發??LINE ?�知
      lineService.sendFallAlert();
      alert("已發?��??�通知（ESP32 ??��?��?，�? LINE ?�知已發?��?");
    }
  };

  const handleRegistration = (data: RegistrationData) => {
    console.log('Registration submitted:', data);
    // Here you would typically send the data to your backend API
    // For now, we'll just log it and show a success message
    alert(`歡�? ${data.name}! ?��?帳�?已�??�建立。`);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans text-slate-800 pb-safe">
      
      <HiddenControls 
        isEnabled={true} 
        onForceSafe={handleForceSafe} 
        onForceFall={handleForceFall} 
      />

      <SettingsModal 
        isOpen={showDevTools}
        onClose={() => setShowDevTools(false)}
        esp32Connected={esp32Connected}
        connectionError={connectionError}
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
      />

      <ESP32SettingsModal 
        isOpen={showESP32Settings}
        onClose={() => setShowESP32Settings(false)}
        onSettingsSaved={() => {
          console.log('ESP32 設置已�?�?);
        }}
      />

      <AlertOverlay 
        isVisible={status === SystemStatus.FALL} 
        onDismiss={handleDismissAlert}
        onCall={handleCallFamilyRequest}
      />

      {/* Header - Adaptive Padding */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 px-4 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0">
            <Activity className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
              <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">Wi-Care</span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Smart Detection</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
            isOffline ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700 shadow-sm'
          }`}>
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {isOffline ? 'Offline' : 'System Ready'}
          </div>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm">
            <button 
                onClick={() => setShowHealthPassport(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors"
                title="?�康??
            >
                <FileHeart className="w-5 h-5" />
            </button>
            
            <button 
                onClick={() => setShowESP32Settings(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-purple-500 transition-colors"
                title="ESP32 設�?"
            >
                <AlertTriangle className="w-5 h-5" />
            </button>

            <button 
                onClick={() => setShowDeviceSetup(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-indigo-500 transition-colors"
                title="裝置設�?"
            >
                <Cpu className="w-5 h-5" />
            </button>

            <button 
                onClick={() => setShowDevTools(true)}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors ${esp32Connected ? 'text-green-500' : 'text-red-500'}`}
                title="?�發?�選??
            >
                <Zap className={`w-5 h-5 ${esp32Connected ? '' : 'animate-pulse'}`} />
            </button>
          </div>

          <button 
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-slate-200 transition-all active:scale-95 shrink-0"
          >
             <UserCircle className="w-11 h-11 sm:w-12 sm:h-12 text-slate-400 mt-2" />
          </button>

          {/* Visible test buttons for quick testing */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleForceFall}
              className="px-3 py-2 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors active:scale-95"
              title="觸發緊�?(Force Fall)"
            >
              觸發緊�?            </button>
            <button
              onClick={handleForceSafe}
              className="px-3 py-2 rounded-full bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors active:scale-95"
              title="?�復安全 (Force Safe)"
            >
              ?�復安全
            </button>
          </div>

          <button 
            onClick={() => setShowRegistration(true)}
            className="hidden sm:flex px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors active:scale-95 whitespace-nowrap"
            title="建�?帳�?"
          >
            註�?
          </button>
        </div>
      </header>

      {/* Mobile Registration Button */}
      <div className="sm:hidden fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setShowRegistration(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors active:scale-95"
          title="建�?帳�?"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Main Content - Fluid Max Widths */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Section: Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Status Card - Flexible Height */}
            <div className="lg:col-span-5 flex flex-col">
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden min-h-[340px] h-full transition-all">
                    
                    <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                        <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === SystemStatus.SAFE ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-full w-full ${status === SystemStatus.SAFE ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                    </div>
                    
                    <div className="flex-1 w-full flex items-center justify-center py-6">
                        <StatusVisual status={status} />
                    </div>

                    <div className="text-center relative z-10 mt-2">
                        <h2 className={`text-2xl sm:text-4xl font-black tracking-tight mb-2 ${status === SystemStatus.SAFE ? 'text-slate-800' : 'text-red-600'}`}>
                            {status === SystemStatus.SAFE ? '一?��?�? : status === SystemStatus.FALL ? '?��? 緊�? : '系統?��?'}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm sm:text-lg px-2">
                            {status === SystemStatus.SAFE ? 'Wi-Care �?��?��?守護?��?家人' : status === SystemStatus.FALL ? '?�測?��??��?�?��?�絡家�??�員...' : '設�??��??��?，�?檢查??��'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6 lg:gap-8">
                
                {/* Stats Cards Row - Stack on tiny screens, side-by-side on typical phones */}
                <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-4 sm:gap-6">
                    {/* Last Activity Card */}
                    <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-32 sm:h-40 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-5 opacity-[0.03]">
                             <Clock className="w-20 h-20 sm:w-24 sm:h-24 text-indigo-600" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                             </div>
                             <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">上次活�?</h3>
                        </div>
                        <div>
                             <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{stats.lastActivity}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-auto overflow-hidden">
                            <div className="bg-indigo-500 w-2/3 h-full rounded-full"></div>
                        </div>
                    </div>

                    {/* Activity Hours Card */}
                    <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-32 sm:h-40 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-5 opacity-[0.03]">
                             <Activity className="w-20 h-20 sm:w-24 sm:h-24 text-purple-600" />
                        </div>
                         <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                             </div>
                             <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">今日活�?</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                             <span className="text-3xl sm:text-4xl font-black text-purple-600 tracking-tight">{stats.activityHours}</span>
                             <span className="text-xs sm:text-sm font-bold text-slate-400">Hours</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-auto overflow-hidden">
                            <div className="bg-purple-500 w-3/4 h-full rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Waveform Monitor */}
                <div className="flex-1 min-h-[220px]">
                     <WaveformMonitor isOffline={isOffline} />
                </div>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 pb-8">
            
            {/* Activity Chart */}
            <div className="lg:col-span-8 bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 min-h-[280px]">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg sm:text-xl text-slate-800">24h 活�?趨勢</h2>
                            <p className="text-xs sm:text-sm text-slate-400 font-medium">Activity Trends</p>
                        </div>
                    </div>
                </div>
                <div className="h-56 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ACTIVITY_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <XAxis 
                              dataKey="time" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}}
                              dy={10}
                            />
                            <Tooltip 
                                cursor={{fill: '#f8fafc', radius: 12}}
                                contentStyle={{
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px 16px',
                                    fontWeight: 'bold',
                                    color: '#475569'
                                }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={24}>
                                {ACTIVITY_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#6366f1" opacity={0.4 + (index * 0.1)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-4 bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                 <div className="flex items-center gap-4 mb-6">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                        <Plug className="w-5 h-5 sm:w-6 sm:h-6" />
                     </div>
                     <div>
                        <h2 className="font-bold text-lg sm:text-xl text-slate-800">快速捷�?/h2>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium">Quick Actions</p>
                     </div>
                 </div>
                 
                 <div className="flex-1 flex flex-col gap-3 sm:gap-4">
                      {/* Manual SOS */}
                      <button 
                        onClick={handleManualSOS}
                        className="flex-1 flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all group active:scale-[0.98]"
                      >
                           <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-red-500 shrink-0">
                                <PhoneOutgoing className="w-6 h-6 sm:w-7 sm:h-7" />
                           </div>
                           <div className="text-left">
                                <span className="block font-bold text-base sm:text-lg text-red-700">?��??��?</span>
                                <span className="text-xs sm:text-sm opacity-70 font-medium">觸發緊�?SOS</span>
                           </div>
                      </button>

                      {/* Health Report */}
                      <button 
                         onClick={() => setShowHealthPassport(true)}
                         className="flex-1 flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100 transition-all group active:scale-[0.98]"
                      >
                           <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-indigo-500 shrink-0">
                                <FileHeart className="w-6 h-6 sm:w-7 sm:h-7" />
                           </div>
                           <div className="text-left">
                                <span className="block font-bold text-base sm:text-lg text-slate-700">?�康?��?</span>
                                <span className="text-xs sm:text-sm opacity-70 font-medium">?��?詳細?��?</span>
                           </div>
                      </button>
                 </div>
            </div>

        </div>

      </main>

    </div>
  );
};

export default App;
