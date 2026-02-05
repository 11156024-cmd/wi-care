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
  Building2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

import { SystemStatus, DashboardStats, SceneMode } from '../WiCare.Types';
import { fetchDeviceStatus, isESP32Connected, getESP32ConnectionStatus, checkESP32Health } from '../services/WiCare.ESP32Api';
import { audioService } from '../services/WiCare.AudioService';
import { lineService } from '../services/WiCare.LineService';
import { esp32Service } from '../services/WiCare.ESP32Service';
import StatusVisual from '../components/WiCare.StatusVisual';
import AlertOverlay from '../components/WiCare.AlertOverlay';
import HiddenControls from '../components/WiCare.HiddenControls';
import WaveformMonitor from '../components/WiCare.WaveformMonitor';

// Mock Data for Charts
const ACTIVITY_DATA = [
  { time: '08:00', value: 10 },
  { time: '10:00', value: 45 },
  { time: '12:00', value: 30 },
  { time: '14:00', value: 15 },
  { time: '16:00', value: 60 },
  { time: '18:00', value: 20 },
];

interface MonitorPageProps {
  esp32Connected: boolean;
  setEsp32Connected: (connected: boolean) => void;
}

const MonitorPage: React.FC<MonitorPageProps> = ({ esp32Connected, setEsp32Connected }) => {
  const [status, setStatus] = useState<SystemStatus>(SystemStatus.SAFE);
  const [isOffline, setIsOffline] = useState<boolean>(true); 
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  
  const [sceneMode, setSceneMode] = useState<SceneMode>('bathroom');
  const [deviceId, setDeviceId] = useState<string>('Wi-Care-Station-01');
  
  const [stats, setStats] = useState<DashboardStats>({
    lastActivity: '剛剛',
    activityHours: 4.5
  });
  
  const hasNotifiedRef = useRef<boolean>(false);

  // 初始化 ESP32 連線
  useEffect(() => {
    const initializeESP32 = async () => {
      try {
        console.log('[MonitorPage] 正在初始化 ESP32 連線...');
        
        const isConnected = await checkESP32Health();
        setEsp32Connected(isConnected);
        setIsOffline(!isConnected);
        
        if (isConnected) {
          console.log('[MonitorPage] ESP32 連線成功');
          setConnectionError(null);
        } else {
          console.log('[MonitorPage] ESP32 離線');
          setConnectionError('無法連接 ESP32');
        }
      } catch (error) {
        console.error('[MonitorPage] ESP32 初始化失敗:', error);
        setEsp32Connected(false);
        setIsOffline(true);
        setConnectionError('ESP32 連線錯誤');
      }
    };

    initializeESP32();
  }, [setEsp32Connected]);

  // ESP32 狀態輪詢
  useEffect(() => {
    if (!esp32Connected) return;

    const pollStatus = async () => {
      try {
        const deviceStatus = await fetchDeviceStatus();
        
        if (deviceStatus.status === 'fall' && status !== SystemStatus.FALL) {
          setStatus(SystemStatus.FALL);
          
          if (!hasNotifiedRef.current) {
            console.log('[MonitorPage] 偵測到跌倒! 啟動警報...');
            audioService.playAlarm();
            lineService.sendFallAlert();
            hasNotifiedRef.current = true;
          }
        } else if (deviceStatus.status === 'safe' && status === SystemStatus.FALL) {
          setStatus(SystemStatus.SAFE);
          audioService.stopAlarm();
          hasNotifiedRef.current = false;
        }
        
        setStats({
          lastActivity: '剛剛',
          activityHours: 4.5
        });
        
      } catch (error) {
        console.error('[MonitorPage] 狀態輪詢失敗:', error);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    
    return () => clearInterval(interval);
  }, [esp32Connected, status]);

  // 測試功能
  const handleForceSafe = async () => {
    try {
      const { clearESP32FallDetection } = await import('../services/WiCare.ESP32Api');
      await clearESP32FallDetection();
      console.log('[MonitorPage] 已通知 ESP32 清除跌倒狀態');
    } catch (error) {
      console.error('[MonitorPage] 無法清除跌倒狀態:', error);
      alert('無法連接 ESP32 來清除狀態');
    }
  };

  const handleForceFall = async () => {
    try {
      const { triggerESP32FallDetection } = await import('../services/WiCare.ESP32Api');
      await triggerESP32FallDetection();
      console.log('[MonitorPage] 已通知 ESP32 觸發跌倒');
    } catch (error) {
      console.error('[MonitorPage] 無法觸發跌倒:', error);
      alert('無法連接 ESP32 來觸發跌倒');
    }
  };

  const handleDismissAlert = async () => {
    try {
      const { clearESP32FallDetection } = await import('../services/WiCare.ESP32Api');
      await clearESP32FallDetection();
      audioService.stopAlarm();
      console.log('[MonitorPage] 警報已解除');
    } catch (error) {
      console.error('[MonitorPage] 無法解除警報:', error);
      audioService.stopAlarm();
    }
  };

  const handleCallFamilyRequest = () => {
    alert("影像已儲存。正在撥打緊急聯絡人: 1 234 567 890");
  };

  const handleCallHospital = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    // 醫院電話號碼
    const hospitalNumber = '02-2312-3456';
    
    try {
      // 開啟撥打電話
      window.location.href = `tel:${hospitalNumber}`;
      
      // 同時發送通知
      lineService.sendFallAlert();
      
      alert(`正在撥打給醫院: ${hospitalNumber}\n同時已發送緊急通知給家人。`);
    } catch (error) {
      console.error('[MonitorPage] 撥打醫院失敗:', error);
      // 備用方案：顯示電話號碼讓使用者手動撥打
      alert(`請手動撥打醫院電話: ${hospitalNumber}`);
    }
  };

  const handleStatusUpdate = (newStatus: SystemStatus) => {
    setStatus(newStatus);
  };

  return (
    <div className="page-content">
      <h1 className="page-title">即時監控</h1>
      
      {/* Main Content Grid */}
      <div className="monitor-grid">
        {/* Status Visual */}
        <div className="monitor-card status-card">
          <div className="card-header">
            <Activity className="card-icon" />
            <h3>系統狀態</h3>
          </div>
          <StatusVisual 
            status={status} 
            isOffline={isOffline}
            esp32Connected={esp32Connected}
          />
        </div>

        {/* Waveform Monitor */}
        <div className="monitor-card waveform-card">
          <div className="card-header">
            <BarChart2 className="card-icon" />
            <h3>訊號波形</h3>
          </div>
          <WaveformMonitor 
            isConnected={esp32Connected}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>

        {/* Activity Chart */}
        <div className="monitor-card activity-card">
          <div className="card-header">
            <Clock className="card-icon" />
            <h3>今日活動量</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ACTIVITY_DATA}>
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {ACTIVITY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 40 ? '#22c55e' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="monitor-card stats-card">
          <div className="card-header">
            <Shield className="card-icon" />
            <h3>快速資訊</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">最後活動</span>
              <span className="stat-value">{stats.lastActivity}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">今日活動時間</span>
              <span className="stat-value">{stats.activityHours} 小時</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">連線狀態</span>
              <span className={`stat-value ${esp32Connected ? 'text-green' : 'text-red'}`}>
                {esp32Connected ? '正常' : '離線'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">場景模式</span>
              <span className="stat-value">{sceneMode === 'bathroom' ? '浴室' : '臥室'}</span>
            </div>
          </div>
        </div>

        {/* 撥打給醫院 Button */}
        <div className="monitor-card sos-card">
          <button onClick={handleCallHospital} className="sos-button hospital-call">
            <PhoneOutgoing className="sos-icon" />
            <span>撥打給醫院</span>
          </button>
        </div>

        {/* Device Info */}
        <div className="monitor-card device-card">
          <div className="card-header">
            <Cpu className="card-icon" />
            <h3>設備資訊</h3>
          </div>
          <div className="device-info">
            <div className="info-row">
              <span className="info-label">設備 ID</span>
              <span className="info-value">{deviceId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">ESP32 狀態</span>
              <span className={`info-value ${esp32Connected ? 'text-green' : 'text-red'}`}>
                {esp32Connected ? (
                  <><Wifi size={16} /> 已連線</>
                ) : (
                  <><WifiOff size={16} /> 離線</>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Overlay */}
      {status === SystemStatus.FALL && (
        <AlertOverlay 
          isVisible={true}
          onDismiss={handleDismissAlert}
          onCallFamily={handleCallFamilyRequest}
        />
      )}

      {/* Hidden Dev Controls */}
      <HiddenControls 
        show={showDevTools}
        onToggle={() => setShowDevTools(!showDevTools)}
        onForceSafe={handleForceSafe}
        onForceFall={handleForceFall}
      />
    </div>
  );
};

export default MonitorPage;
