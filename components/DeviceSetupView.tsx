import React from 'react';
import { 
  ArrowLeft, 
  Cpu, 
  Wifi, 
  Settings, 
  Activity, 
  Box,
  Dog,
  RefreshCw,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { useDeviceSetupViewModel } from '../hooks/useDeviceSetupViewModel';

interface DeviceSetupViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeviceSetupView: React.FC<DeviceSetupViewProps> = ({ isOpen, onClose }) => {
  const { 
    config, 
    updateConfig, 
    isCalibrating, 
    calibrationProgress, 
    calibrationStep,
    startCalibration 
  } = useDeviceSetupViewModel(onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
      
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={onClose}
          disabled={isCalibrating}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h1 className="font-bold text-lg text-slate-800">裝置設定與校正</h1>
        </div>
        <div className="w-10" /> 
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="max-w-md mx-auto space-y-6">

          {/* 1. Device Status Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
                <Cpu className="w-24 h-24 text-indigo-600" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Online
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">FW: {config.firmwareVersion}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4">Wi-Care Sensor Unit</h2>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                                <Wifi className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Wi-Fi Network</p>
                                <p className="text-sm font-semibold text-slate-700">Home_5G_Mesh</p>
                            </div>
                        </div>
                        <Activity className="w-5 h-5 text-green-500" />
                    </div>
                </div>
             </div>
          </div>

          {/* 2. Unified Settings Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
             
             {/* Section Header */}
             <div className="px-5 py-4 bg-slate-50 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">系統參數設定 (Configuration)</span>
             </div>

             {/* Item 1: Installation Location */}
             <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <label className="text-sm font-bold text-slate-700">安裝位置</label>
                </div>
                
                <div className="relative w-full">
                    <select 
                        value={config.location}
                        onChange={(e) => updateConfig('location', e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                        <option value="master_bath">主臥浴室 (Master Bath)</option>
                        <option value="guest_restroom">客用廁所 (Guest Room)</option>
                        <option value="bedroom">臥房 (Bedroom)</option>
                        <option value="living_room">客廳 (Living Room)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 pl-1">
                    * 建議安裝高度：離地 1.5m - 2.0m，避免遮蔽物。
                </p>
             </div>

             {/* Item 2: Room Size */}
             <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center">
                        <Box className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <label className="text-sm font-bold text-slate-700">空間大小</label>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
                    {(['small', 'medium', 'large'] as const).map((size) => {
                        const isActive = config.roomSize === size;
                        return (
                            <button
                                key={size}
                                onClick={() => updateConfig('roomSize', size)}
                                className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                                    isActive 
                                    ? 'bg-white text-indigo-600 shadow-sm scale-[1.02]' 
                                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {size === 'small' && '小 (<2坪)'}
                                {size === 'medium' && '中 (3-5坪)'}
                                {size === 'large' && '大 (>6坪)'}
                            </button>
                        );
                    })}
                </div>
             </div>

             {/* Item 3: Pet Mode */}
             <div 
                className="p-5 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
                onClick={() => updateConfig('hasPets', !config.hasPets)}
             >
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center">
                            <Dog className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">抗干擾模式 (寵物)</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pl-8">
                        啟用後，系統將自動過濾離地 50cm 以下的微小移動訊號，以避免貓狗造成誤報。
                    </p>
                </div>
                
                {/* Custom Toggle Switch */}
                <div className={`mt-1 w-12 h-7 rounded-full transition-colors duration-300 relative shrink-0 ${config.hasPets ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.hasPets ? 'left-6' : 'left-1'}`} />
                </div>
             </div>
          </div>

          {/* 4. Calibration Action */}
          <div className="pt-2">
             {isCalibrating ? (
                 <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-lg text-center space-y-4 animate-in fade-in zoom-in-95">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <RefreshCw className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">正在校正環境...</h3>
                        <p className="text-sm text-slate-500 font-mono mt-1">{calibrationStep}</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                            style={{ width: `${calibrationProgress}%` }}
                        />
                    </div>
                 </div>
             ) : (
                 <button 
                    onClick={startCalibration}
                    className="group w-full bg-slate-900 hover:bg-slate-800 text-white p-1 rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex flex-col items-center"
                 >
                    <div className="w-full py-4 flex items-center justify-center gap-3">
                        <RefreshCw className="w-5 h-5 text-indigo-300 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="font-bold text-lg">開始環境校正</span>
                    </div>
                    {config.lastCalibrated && (
                        <div className="w-full bg-white/5 py-1.5 text-center border-t border-white/10 rounded-b-xl">
                            <span className="text-[10px] text-slate-400 font-mono">
                                上次校正: {new Date(config.lastCalibrated).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                 </button>
             )}
             <p className="text-[10px] text-slate-400 text-center mt-3 px-4">
                * 點擊後請保持空間淨空，系統需約 5 秒讀取環境背景值。
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeviceSetupView;