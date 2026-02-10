import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, Zap, Pause, Play, Settings, Wifi, WifiOff } from 'lucide-react';
import wsService from '../services/WebSocketService';

interface WaveformMonitorProps {
  isOffline?: boolean;
  isConnected?: boolean;
  onStatusUpdate?: (status: any) => void;
}

const WaveformMonitor: React.FC<WaveformMonitorProps> = ({
  isOffline = false,
  isConnected = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<number[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(1);
  const [displayMode, setDisplayMode] = useState<'line' | 'bar'>('line');
  const [wsConnected, setWsConnected] = useState(false);
  const [dataSource, setDataSource] = useState<'ws' | 'sim'>('ws');
  const title = 'CSI 波形監測';

  // WebSocket 即時數據 或 模擬數據
  useEffect(() => {
    if (!isMonitoring || isOffline) return;

    // 嘗試 WebSocket 連線
    wsService.connect();
    const unsubConnect = wsService.on('connected', () => setWsConnected(true));

    // 接收即時感測數據
    const unsubSensor = wsService.on('sensor_update', (msg) => {
      if (msg.movement_score != null) {
        setData(prev => {
          const newData = [...prev, msg.movement_score!];
          return newData.length > 100 ? newData.slice(-100) : newData;
        });
        setDataSource('ws');
      }
    });

    // Fallback: 如果 WebSocket 沒數據，自動切換模擬模式
    let simInterval: ReturnType<typeof setInterval> | null = null;
    const simTimeout = setTimeout(() => {
      if (dataSource !== 'ws' || !wsConnected) {
        simInterval = setInterval(() => {
          setData(prev => {
            const newValue = Math.sin(Date.now() / 200) * 50 + Math.random() * 30 - 15;
            const newData = [...prev, newValue];
            return newData.length > 100 ? newData.slice(-100) : newData;
          });
          setDataSource('sim');
        }, 50);
      }
    }, 3000); // 3 秒後若無數據則啟用模擬

    return () => {
      unsubConnect();
      unsubSensor();
      clearTimeout(simTimeout);
      if (simInterval) clearInterval(simInterval);
    };
  }, [isMonitoring, isOffline]);

  const onToggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 網格線
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < rect.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(rect.width, i);
      ctx.stroke();
    }
    
    for (let i = 0; i < rect.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, rect.height);
      ctx.stroke();
    }

    if (data.length === 0) {
      // 無數據時顯示提示
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isOffline ? '設備離線' : '等待數據...', rect.width / 2, rect.height / 2);
      return;
    }

    const centerY = rect.height / 2;
    const xStep = rect.width / (data.length - 1 || 1);
    const yScale = (rect.height / 2 - 20) * sensitivity / 100;

    if (displayMode === 'line') {
      // 繪製波形
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 6;

      data.forEach((value, index) => {
        const x = index * xStep;
        const y = centerY - value * yScale;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // 柱狀圖模式
      const barWidth = Math.max(2, xStep - 1);
      data.forEach((value, index) => {
        const x = index * xStep;
        const barHeight = Math.abs(value) * yScale;
        const y = value >= 0 ? centerY - barHeight : centerY;
        ctx.fillStyle = value >= 0 ? '#3b82f6' : '#ec4899';
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // 中心線
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(rect.width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [data, sensitivity, displayMode, isOffline]);

  const currentValue = data.length > 0 ? data[data.length - 1] : 0;
  const avgValue = data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;
  const maxValue = data.length > 0 ? Math.max(...data.map(Math.abs)) : 0;

  return (
    <div className="tech-card card-hover rounded-2xl overflow-hidden h-full relative">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="icon-container icon-container-primary">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-base sm:text-lg">{title}</h3>
            <span className={`text-xs flex items-center gap-1.5 mt-0.5 ${
              isMonitoring && !isOffline
                ? 'text-emerald-600' 
                : 'text-slate-400'
            }`}>
              {isMonitoring && !isOffline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-medium">運行中</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>{isOffline ? '離線' : '已暫停'}</span>
                </>
              )}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMonitoring}
            disabled={isOffline}
            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all disabled:opacity-30 active:scale-95"
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-lg transition-all active:scale-95 border ${showSettings ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-4">
          <div>
            <label className="text-slate-600 text-xs font-medium block mb-2">靈敏度</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium block mb-2">顯示模式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDisplayMode('line')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border ${displayMode === 'line' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
              >
                波形圖
              </button>
              <button
                onClick={() => setDisplayMode('bar')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border ${displayMode === 'bar' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
              >
                頻譜圖
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-white" style={{ height: '150px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        {/* Edge gradients */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>

      <div className="flex justify-between items-center p-4 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-slate-400">當前:</span>
          <span className="text-slate-700 font-semibold">{currentValue.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-slate-400">平均:</span>
          <span className="text-slate-700 font-semibold">{avgValue.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className="text-slate-400">最大:</span>
          <span className="text-slate-700 font-semibold">{maxValue.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {dataSource === 'ws' ? (
            <Wifi className="w-3 h-3 text-emerald-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-500" />
          )}
          <span className="text-slate-400">{dataSource === 'ws' ? '即時' : '模擬'}</span>
        </div>
      </div>
    </div>
  );
};

export default WaveformMonitor;
