import React from 'react';
import { X, Server, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  esp32Connected: boolean;
  connectionError: string | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  esp32Connected,
  connectionError,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs mx-4 mb-4 sm:mb-0 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 border border-slate-100">
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700">系統狀態</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          {/* ESP32 Connection Status */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ESP32-S3 連線狀態
              </h3>
              {esp32Connected ? (
                <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  連線中
                </span>
              ) : (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  離線
                </span>
              )}
            </div>
            
            <div className={`rounded-xl p-4 border ${esp32Connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${esp32Connected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {esp32Connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${esp32Connected ? 'text-green-700' : 'text-red-700'}`}>
                    {esp32Connected ? '已連接 ESP32-S3' : 'ESP32-S3 離線'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {esp32Connected ? 'IP: 172.20.10.9:8080' : '請檢查設備電源與網路'}
                  </p>
                </div>
                {esp32Connected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              {connectionError && !esp32Connected && (
                <div className="mt-3 p-2 bg-red-100 rounded-lg">
                  <p className="text-xs text-red-600 font-mono break-all">{connectionError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Data Source Info */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                數據來源
              </h3>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-mono font-bold">
                實時數據
              </span>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-blue-700 text-sm">ESP32 真實感測器</p>
                  <p className="text-xs text-slate-500">CSI WiFi 動作偵測（無模擬數據）</p>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div className="px-5 py-3 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-mono">Wi-Care System v2.0.0</p>
            <p className="text-[10px] text-slate-300 font-mono mt-0.5">ESP32-S3 | 實盤模式 | 無假數據</p>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;