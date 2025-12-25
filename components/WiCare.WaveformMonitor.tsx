import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Wifi, Zap, Radio } from 'lucide-react';

interface WaveformMonitorProps {
  isOffline: boolean;
}

const DATA_POINTS = 50;

const WaveformMonitor: React.FC<WaveformMonitorProps> = ({ isOffline }) => {
  const [data, setData] = useState<{ index: number; value: number }[]>(
    Array.from({ length: DATA_POINTS }, (_, i) => ({ index: i, value: 50 }))
  );
  const [rssi, setRssi] = useState(-45);
  const [activityLevel, setActivityLevel] = useState(0); // 0-100
  const [isReceiving, setIsReceiving] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setData(Array.from({ length: DATA_POINTS }, (_, i) => ({ index: i, value: 0 })));
      setRssi(-90);
      setActivityLevel(0);
      setIsReceiving(false);
      return;
    }

    setIsReceiving(true);

    const interval = setInterval(() => {
      // Simulate activity
      const activityTrend = Math.sin(Date.now() / 4000) * 0.5 + 0.5; // Slower wave
      const currentActivity = activityTrend * 80 + (Math.random() * 20);
      
      setActivityLevel(Math.floor(currentActivity));

      setData(currentData => {
        const amplitude = 5 + (currentActivity / 100) * 45; 
        const time = Date.now() / 200;
        const base = Math.sin(time) * amplitude + 50;
        const noise = (Math.random() - 0.5) * (amplitude / 3);
        let newValue = base + noise;
        
        // Clamp
        newValue = Math.max(5, Math.min(95, newValue));

        const newData = [...currentData.slice(1), { index: currentData[currentData.length - 1].index + 1, value: newValue }];
        return newData;
      });

      // Fluctuate RSSI
      setRssi(prev => {
        const drift = Math.random() > 0.5 ? 1 : -1;
        let next = prev + drift;
        if (next > -35) next = -35;
        if (next < -65) next = -65;
        return next;
      });

    }, 60);

    return () => clearInterval(interval);
  }, [isOffline]);

  const isMoving = activityLevel > 20;

  return (
    <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 w-full h-full flex flex-col relative overflow-hidden group">
      
      {/* Background decoration */}
      <div className={`absolute -top-20 -right-20 w-48 h-48 sm:w-64 sm:h-64 bg-blue-50/50 rounded-full blur-3xl transition-opacity duration-1000 ${isMoving ? 'opacity-100' : 'opacity-30'}`} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 z-10 gap-3">
        
        {/* Title & Status */}
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-slate-300' : 'bg-green-500 animate-pulse'}`}></div>
             <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">CSI Signal Monitor</h3>
           </div>
           
           <div className={`text-base sm:text-lg font-bold flex items-center gap-2 transition-colors duration-300 ${isOffline ? 'text-slate-400' : 'text-slate-800'}`}>
              {isOffline ? (
                  <>
                    <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>è¨Šè?ä¸­æ–·</span>
                  </>
              ) : isMoving ? (
                  <>
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <span>?µæ¸¬?°æ´»??/span>
                  </>
              ) : (
                  <>
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    <span>?œæ­¢ä¸?/span>
                  </>
              )}
           </div>
        </div>

        {/* Metrics Pill */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 bg-slate-50 rounded-2xl p-2 pr-4 border border-slate-100">
             {/* Activity Metric */}
             <div className="flex flex-col items-center px-2 border-r border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Activity</span>
                <span className={`text-sm font-mono font-bold ${activityLevel > 50 ? 'text-blue-600' : 'text-slate-600'}`}>
                    {isOffline ? '--' : activityLevel}%
                </span>
             </div>

             {/* RSSI Metric */}
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="text-sm font-mono font-bold">{isOffline ? '--' : rssi} dBm</span>
                </div>
             </div>
        </div>
      </div>
      
      {/* Chart Area - Increased bottom padding (pb-4) and adjusted margins */}
      <div className="flex-1 w-full min-h-[160px] sm:min-h-[180px] relative z-0 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            {/* Extended domain to [-20, 120] to make the wave float more centrally */}
            <YAxis domain={[-20, 120]} hide />
            <Tooltip 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-slate-800 text-white text-xs font-mono py-1 px-2 rounded shadow-lg">
                        {payload[0].value?.toFixed(1)}
                        </div>
                    );
                    }
                    return null;
                }}
            />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isOffline ? "#cbd5e1" : "#3b82f6"} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default WaveformMonitor;
