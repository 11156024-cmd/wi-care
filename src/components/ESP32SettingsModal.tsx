import React, { useState } from 'react';
import { X, Settings, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { esp32Service } from '../services/ESP32Service';
import { updateESP32Config, checkESP32Health } from '../services/ESP32Api';

interface ESP32SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

const ESP32SettingsModal: React.FC<ESP32SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  const currentConfig = esp32Service.getConfig();
  const [host, setHost] = useState<string>(currentConfig.host || '172.20.10.9');
  const [port, setPort] = useState<number>(currentConfig.port || 8080);
  const [useWebSocket, setUseWebSocket] = useState<boolean>(currentConfig.useWebSocket ?? false);
  const [testing, setTesting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSaveSettings = async () => {
    setTesting(true);
    setErrorMessage('');
    setConnectionStatus('connecting');

    try {
      esp32Service.updateConfig({
        host,
        port,
        useWebSocket
      });
      
      updateESP32Config(host, port);

      const healthOk = await checkESP32Health();
      if (!healthOk) {
        throw new Error(`無法連接到 ESP32 (${host}:${port})`);
      }

      try {
        await esp32Service.connect();
      } catch (wsError) {
        console.log('[ESP32] WebSocket 連接失敗，將使用 HTTP 模式');
      }
      
      setConnectionStatus('connected');
      
      setTimeout(() => {
        if (onSettingsSaved) {
          onSettingsSaved();
        }
        onClose();
      }, 1500);
    } catch (error) {
      setConnectionStatus('failed');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : '無法連接到 ESP32 設備'
      );
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">ESP32 設定</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">配置設備連接</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={testing}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
            esp32Service.getConnectionStatus()
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <Wifi className={`w-5 h-5 shrink-0 mt-0.5 ${
              esp32Service.getConnectionStatus() 
                ? 'text-green-600' 
                : 'text-amber-600'
            }`} />
            <div>
              <p className="font-semibold text-sm">
                {esp32Service.getConnectionStatus() ? '已連接' : '未連接'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {currentConfig.host}:{currentConfig.port}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ESP32 IP 位址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="例如: 192.168.1.100"
              disabled={testing}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-300 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              請輸入 ESP32-S3 開發板的 IP 位址
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              連接埠 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 8080)}
              placeholder="8080"
              disabled={testing}
              min={1}
              max={65535}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-300 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              WebSocket 或 HTTP API 連接埠
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              連接模式
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setUseWebSocket(true)}
                disabled={testing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  useWebSocket
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                WebSocket
              </button>
              <button
                onClick={() => setUseWebSocket(false)}
                disabled={testing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !useWebSocket
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                HTTP API
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {useWebSocket
                ? 'WebSocket：用於實時數據通信'
                : 'HTTP API：用於簡單的 REST 調用'
              }
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">已成功連接到 ESP32</p>
            </div>
          )}

          {connectionStatus === 'connecting' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <div className="animate-spin">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700">正在連接設備...</p>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-sm text-slate-900 mb-2">設置步驟</h4>
            <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
              <li>確保 ESP32-S3 開發板已上傳網頁伺服器代碼</li>
              <li>記錄開發板的 IP 位址和連接埠</li>
              <li>輸入上述位址和連接埠</li>
              <li>點擊「測試並保存」驗證連接</li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200/50 bg-slate-50">
          <button
            onClick={onClose}
            disabled={testing}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={testing || !host.trim() || port < 1 || port > 65535}
            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <div className="animate-spin">
                  <Wifi className="w-4 h-4" />
                </div>
                <span>測試中...</span>
              </>
            ) : (
              '測試並保存'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ESP32SettingsModal;

