import React, { useState } from 'react';
import { ArrowLeft, Cpu, Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Zap, Settings, Radio, Activity, Shield, Server, Gauge, X } from 'lucide-react';
import { esp32Service } from '../services/WiCare.ESP32Service';
import { checkESP32Health } from '../services/WiCare.ESP32Api';

interface DeviceSetupViewProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenESP32Settings: () => void;
}

const DeviceSetupView: React.FC<DeviceSetupViewProps> = ({ isOpen, onClose, onOpenESP32Settings }) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  const config = esp32Service.getConfig();

  const handleCheckConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isHealthy = await checkESP32Health();
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    setCalibrationStatus('idle');
    setCalibrationProgress(0);
    
    try {
      // 模擬校準進度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setCalibrationProgress(i);
      }
      setCalibrationStatus('success');
    } catch {
      setCalibrationStatus('error');
    } finally {
      setIsCalibrating(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      handleCheckConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 overflow-y-auto">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={onClose}
            className="p-2.5 -ml-2 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">裝置設定與校準</h1>
              <p className="text-xs text-slate-500">Device Configuration</p>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="relative p-4 space-y-5 pb-8">
        
        {/* Connection Status Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Card Header with Gradient */}
          <div className={`px-5 py-4 ${
            connectionStatus === 'connected' 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
              : connectionStatus === 'disconnected'
                ? 'bg-gradient-to-r from-red-500 to-rose-500'
                : 'bg-gradient-to-r from-slate-400 to-slate-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  {connectionStatus === 'connected' ? (
                    <Wifi className="w-6 h-6 text-white" />
                  ) : connectionStatus === 'disconnected' ? (
                    <WifiOff className="w-6 h-6 text-white" />
                  ) : (
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">ESP32-S3 連線狀態</h3>
                  <p className="text-white/80 text-sm font-mono">
                    {config.host}:{config.port}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                connectionStatus === 'connected'
                  ? 'bg-white/20 text-white'
                  : connectionStatus === 'disconnected'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/20 text-white'
              }`}>
                {connectionStatus === 'connected' ? '✓ 已連接' : connectionStatus === 'disconnected' ? '✗ 未連接' : '檢查中...'}
              </div>
            </div>
          </div>

          {/* Connection Indicator Animation */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-8 rounded-full transition-all duration-300 ${
                      connectionStatus === 'connected' 
                        ? 'bg-emerald-500' 
                        : connectionStatus === 'checking'
                          ? 'bg-slate-300 animate-pulse'
                          : i === 0 ? 'bg-red-500' : 'bg-slate-200'
                    }`}
                    style={{ 
                      height: `${12 + i * 6}px`,
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-700">訊號強度</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      connectionStatus === 'connected' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 w-4/5' 
                        : 'bg-slate-300 w-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex gap-3">
            <button
              onClick={handleCheckConnection}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
              重新檢查
            </button>
            <button
              onClick={onOpenESP32Settings}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              設定連線
            </button>
          </div>
        </div>

        {/* Calibration Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Gauge className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">感測器校準</h3>
                <p className="text-white/80 text-sm">校準 CSI 感測器以提高準確度</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {/* Calibration Visual */}
            <div className="relative h-32 mb-5 flex items-center justify-center">
              {/* Circular Progress */}
              <div className="relative">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="url(#calibGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${calibrationProgress * 3.02} 302`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="calibGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isCalibrating ? (
                    <>
                      <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
                      <span className="text-2xl font-bold text-slate-800 mt-1">{calibrationProgress}%</span>
                    </>
                  ) : calibrationStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-600 mt-1">完成</span>
                    </>
                  ) : calibrationStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-10 h-10 text-red-500" />
                      <span className="text-sm font-semibold text-red-600 mt-1">失敗</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-8 h-8 text-amber-500" />
                      <span className="text-sm font-medium text-slate-500 mt-1">待校準</span>
                    </>
                  )}
                </div>
              </div>

              {/* Floating Particles */}
              {isCalibrating && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-amber-400 rounded-full animate-ping"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${20 + Math.random() * 60}%`,
                        animationDelay: `${i * 200}ms`,
                        animationDuration: '1.5s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {calibrationStatus === 'success' && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-emerald-700 block">校準完成！</span>
                  <span className="text-sm text-emerald-600">感測器已準備就緒</span>
                </div>
              </div>
            )}

            {calibrationStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-red-700 block">校準失敗</span>
                  <span className="text-sm text-red-600">請檢查連線後重試</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCalibrate}
              disabled={isCalibrating || connectionStatus !== 'connected'}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-base hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
            >
              {isCalibrating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  校準中... {calibrationProgress}%
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  開始校準
                </>
              )}
            </button>

            <p className="text-sm text-slate-500 text-center mt-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              校準期間請保持環境穩定，約需 3 秒
            </p>
          </div>
        </div>

        {/* Device Info Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-slate-700 to-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">裝置資訊</h3>
                <p className="text-white/70 text-sm">Device Information</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-0">
            {[
              { label: '裝置類型', value: 'ESP32-S3', icon: Cpu, color: 'blue' },
              { label: '連線模式', value: config.useWebSocket ? 'WebSocket' : 'HTTP API', icon: Radio, color: 'violet' },
              { label: 'IP 位址', value: config.host, icon: Wifi, color: 'emerald', mono: true },
              { label: '連接埠', value: config.port, icon: Server, color: 'amber', mono: true }
            ].map((item, index) => (
              <div 
                key={item.label}
                className={`flex items-center justify-between py-4 ${
                  index !== 3 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    item.color === 'violet' ? 'bg-violet-100 text-violet-600' :
                    item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-slate-600 font-medium">{item.label}</span>
                </div>
                <span className={`text-slate-800 font-semibold ${item.mono ? 'font-mono bg-slate-100 px-3 py-1 rounded-lg text-sm' : ''}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-5 shadow-xl shadow-blue-500/25 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-white font-bold text-lg">使用小秘訣</h4>
            </div>
            <ul className="space-y-3">
              {[
                '確保 ESP32 與手機在同一 WiFi 網路',
                '定期校準可提高偵測準確度',
                '環境變化時建議重新校準'
              ].map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-white/90 text-sm">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeviceSetupView;
