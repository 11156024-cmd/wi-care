import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Activity,
  Clock,
  PhoneOutgoing,
  Cpu,
  BarChart2,
  Shield,
  Users,
  Bell,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { SystemStatus, SceneMode } from '../types';
import { checkESP32Health } from '../services/ESP32Api';
import { audioService } from '../services/AudioService';
import { lineService } from '../services/LineService';
import { statsApi } from '../services/ApiService';
import { wsService } from '../services/WebSocketService';
import StatusVisual from '../components/StatusVisual';
import AlertOverlay from '../components/AlertOverlay';
import HiddenControls from '../components/HiddenControls';
import WaveformMonitor from '../components/WaveformMonitor';

interface DashboardStats {
  totalElderly: number;
  onlineDevices: number;
  totalDevices: number;
  todayEvents: number;
  todayFallAlerts: number;
  unresolvedAlerts: number;
}

interface ActivityPoint {
  time: string;
  value: number;
}

const buildHourlySlots = (): ActivityPoint[] => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const h = now.getHours() - 10 + i * 2;
    const label = `${((h + 24) % 24).toString().padStart(2, '0')}:00`;
    return { time: label, value: 0 };
  });
};

interface MonitorPageProps {
  esp32Connected: boolean;
  setEsp32Connected: (v: boolean) => void;
}

const MonitorPage: React.FC<MonitorPageProps> = ({ esp32Connected, setEsp32Connected }) => {
  const [status, setStatus] = useState<SystemStatus>(SystemStatus.SAFE);
  const [isOffline, setIsOffline] = useState<boolean>(true);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  const [sceneMode, setSceneMode] = useState<SceneMode>(() => {
    return (localStorage.getItem('wi-care-scene-mode') as SceneMode) || 'bathroom';
  });
  const [deviceId] = useState<string>(() =>
    localStorage.getItem('wi-care-esp32-device-id') || 'Wi-Care-Station-01'
  );
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalElderly: 0,
    onlineDevices: 0,
    totalDevices: 0,
    todayEvents: 0,
    todayFallAlerts: 0,
    unresolvedAlerts: 0,
  });
  const [activityData, setActivityData] = useState<ActivityPoint[]>(buildHourlySlots);
  const [movementScore, setMovementScore] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('--');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [callMsg, setCallMsg] = useState<string | null>(null);
  const hasNotifiedRef = useRef<boolean>(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await statsApi.getDashboard();
      setDashboardStats(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.warn('[MonitorPage] 無法取得統計資料:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const ok = await checkESP32Health();
        setEsp32Connected(ok);
        setIsOffline(!ok);
      } catch {
        setEsp32Connected(false);
        setIsOffline(true);
      }
    };
    init();
    loadStats();
    const statsTimer = setInterval(loadStats, 30000);
    return () => clearInterval(statsTimer);
  }, [setEsp32Connected, loadStats]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFallAlert = (data: any) => {
      setStatus(SystemStatus.FALL);
      if (!hasNotifiedRef.current) {
        audioService.playAlarm();
        lineService.sendFallAlert();
        hasNotifiedRef.current = true;
      }
      setLastUpdateTime(new Date().toLocaleTimeString('zh-TW'));
      setDashboardStats(prev => ({
        ...prev,
        todayFallAlerts: prev.todayFallAlerts + 1,
        todayEvents: prev.todayEvents + 1,
        unresolvedAlerts: prev.unresolvedAlerts + 1,
      }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSensorUpdate = (data: any) => {
      if (typeof data.movement_score === 'number') {
        setMovementScore(data.movement_score);
      }
      if (data.status === 'safe') {
        setStatus(prev => {
          if (prev === SystemStatus.FALL) {
            audioService.stopAlarm();
            hasNotifiedRef.current = false;
          }
          return SystemStatus.SAFE;
        });
      }
      setLastUpdateTime(new Date().toLocaleTimeString('zh-TW'));
      setActivityData(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            value: Math.min(100, (updated[updated.length - 1].value || 0) + 1),
          };
        }
        return updated;
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDeviceStatus = (data: any) => {
      if (data.status === 'online') { setIsOffline(false); setEsp32Connected(true); }
      else if (data.status === 'offline') { setIsOffline(true); setEsp32Connected(false); }
    };

    const unsubFall = wsService.on('fall_alert', handleFallAlert);
    const unsubSensor = wsService.on('sensor_update', handleSensorUpdate);
    const unsubDevice = wsService.on('device_status', handleDeviceStatus);
    return () => {
      unsubFall();
      unsubSensor();
      unsubDevice();
    };
  }, [setEsp32Connected]);

  const handleSceneChange = (mode: SceneMode) => {
    setSceneMode(mode);
    localStorage.setItem('wi-care-scene-mode', mode);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const ok = await checkESP32Health();
      setEsp32Connected(ok);
      setIsOffline(!ok);
      await loadStats();
      setLastUpdateTime(new Date().toLocaleTimeString('zh-TW'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceSafe = async () => {
    try {
      const { clearESP32FallDetection } = await import('../services/ESP32Api');
      await clearESP32FallDetection();
    } catch {
      setStatus(SystemStatus.SAFE);
      audioService.stopAlarm();
      hasNotifiedRef.current = false;
    }
  };

  const handleForceFall = async () => {
    try {
      const { triggerESP32FallDetection } = await import('../services/ESP32Api');
      await triggerESP32FallDetection();
    } catch {
      setStatus(SystemStatus.FALL);
      audioService.playAlarm();
    }
  };

  const handleDismissAlert = async () => {
    try {
      const { clearESP32FallDetection } = await import('../services/ESP32Api');
      await clearESP32FallDetection();
    } catch { /* ignore */ }
    setStatus(SystemStatus.SAFE);
    audioService.stopAlarm();
    hasNotifiedRef.current = false;
    setDashboardStats(prev => ({ ...prev, unresolvedAlerts: Math.max(0, prev.unresolvedAlerts - 1) }));
  };

  const handleCallFamilyRequest = () => {
    lineService.sendFallAlert();
    setCallMsg('已向緊急聯絡人發送 LINE 通知。');
    setTimeout(() => setCallMsg(null), 5000);
  };

  const handleCallHospital = () => {
    if (navigator.vibrate) navigator.vibrate(200);
    window.location.href = 'tel:02-2312-3456';
    setCallMsg('正在撥打醫院：02-2312-3456');
    setTimeout(() => setCallMsg(null), 5000);
  };

  const handleStatusUpdate = (newStatus: SystemStatus) => setStatus(newStatus);

  const sceneModeLabel: Record<string, string> = {
    bathroom: '浴室', bedroom: '臥室', living_room: '客廳', kitchen: '廚房',
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>即時監控</h1>
        <button
          onClick={handleManualRefresh}
          title="重新整理"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 6 }}
        >
          <RefreshCw size={20} className={isRefreshing ? 'spin' : ''} />
        </button>
      </div>

      {callMsg && (
        <div style={{
          background: '#1e3a5f', color: '#fff', borderRadius: 8, padding: '10px 16px',
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
        }}>
          <CheckCircle size={16} color="#4ade80" />
          {callMsg}
        </div>
      )}

      <div className="monitor-grid">
        <div className="monitor-card status-card">
          <div className="card-header">
            <Activity className="card-icon" />
            <h3>系統狀態</h3>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>更新：{lastUpdateTime}</span>
          </div>
          <StatusVisual
            status={status}
            isOffline={isOffline}
            esp32Connected={esp32Connected}
            movementScore={movementScore}
          />
        </div>

        <div className="monitor-card waveform-card">
          <div className="card-header">
            <BarChart2 className="card-icon" />
            <h3>訊號波形</h3>
          </div>
          <WaveformMonitor isConnected={esp32Connected} onStatusUpdate={handleStatusUpdate} />
        </div>

        <div className="monitor-card activity-card">
          <div className="card-header">
            <Clock className="card-icon" />
            <h3>今日活動量</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData}>
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} 次`, '活動次數']} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {activityData.map((_, i) => (
                    <Cell key={i} fill={activityData[i].value > 40 ? '#22c55e' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="monitor-card stats-card">
          <div className="card-header">
            <Shield className="card-icon" />
            <h3>快速資訊</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label"><Users size={12} style={{ verticalAlign:'middle', marginRight:3 }}/>監控人數</span>
              <span className="stat-value">{dashboardStats.totalElderly} 人</span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><Wifi size={12} style={{ verticalAlign:'middle', marginRight:3 }}/>連線設備</span>
              <span className="stat-value">{dashboardStats.onlineDevices}/{dashboardStats.totalDevices}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><Activity size={12} style={{ verticalAlign:'middle', marginRight:3 }}/>今日事件</span>
              <span className="stat-value">{dashboardStats.todayEvents} 次</span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><AlertTriangle size={12} style={{ verticalAlign:'middle', marginRight:3, color:'#ef4444' }}/>跌倒警報</span>
              <span className="stat-value" style={{ color: dashboardStats.todayFallAlerts > 0 ? '#ef4444' : undefined }}>
                {dashboardStats.todayFallAlerts} 次
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><Bell size={12} style={{ verticalAlign:'middle', marginRight:3 }}/>未處理警報</span>
              <span className="stat-value" style={{ color: dashboardStats.unresolvedAlerts > 0 ? '#f59e0b' : undefined }}>
                {dashboardStats.unresolvedAlerts} 件
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><Cpu size={12} style={{ verticalAlign:'middle', marginRight:3 }}/>動作分數</span>
              <span className="stat-value">{movementScore.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="monitor-card">
          <div className="card-header">
            <Shield className="card-icon" />
            <h3>場景模式</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
            {Object.entries(sceneModeLabel).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => handleSceneChange(mode as SceneMode)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: '1px solid',
                  borderColor: sceneMode === mode ? '#3b82f6' : '#374151',
                  background: sceneMode === mode ? '#3b82f6' : 'transparent',
                  color: sceneMode === mode ? '#fff' : '#9ca3af',
                  cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="monitor-card sos-card">
          <button onClick={handleCallHospital} className="sos-button hospital-call">
            <PhoneOutgoing className="sos-icon" />
            <span>撥打醫院</span>
          </button>
        </div>

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
                {esp32Connected ? <><Wifi size={14}/> 已連線</> : <><WifiOff size={14}/> 離線</>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {status === SystemStatus.FALL && (
        <AlertOverlay isVisible onDismiss={handleDismissAlert} onCallFamily={handleCallFamilyRequest} />
      )}

      <HiddenControls
        show={showDevTools}
        onToggle={() => setShowDevTools(s => !s)}
        onForceSafe={handleForceSafe}
        onForceFall={handleForceFall}
      />
    </div>
  );
};

export default MonitorPage;
