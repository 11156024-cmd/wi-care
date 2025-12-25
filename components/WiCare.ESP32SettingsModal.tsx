import React, { useState } from 'react';
import { X, Settings, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { esp32Service } from '../services/WiCare.ESP32Service';
import { updateESP32Config, checkESP32Health } from '../services/WiCare.ESP32Api';

interface ESP32SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

const ESP32SettingsModal: React.FC<ESP32SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  // ÂæûÁï∂?çÈ?ÁΩÆÂ?ÂßãÂ?ÔºåÈ?Ë®≠‰Ωø?®ÂØ¶?õÁ? ESP32 IP
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
      // Update both services with the same config
      esp32Service.updateConfig({
        host,
        port,
        useWebSocket
      });
      
      // ?åÊ≠•?¥Êñ∞ mockApi ??ESP32 ?çÁΩÆÔºàÁî®?ºÁ??ãËº™Ë©¢Ô?
      updateESP32Config(host, port);

      // ?àÊ∏¨Ë©?HTTP ??é•
      const healthOk = await checkESP32Health();
      if (!healthOk) {
        throw new Error(`?°Ê???é•??ESP32 (${host}:${port})`);
      }

      // Try to connect via WebSocket (optional)
      try {
        await esp32Service.connect();
      } catch (wsError) {
        console.log('[ESP32] WebSocket ??é•Â§±Ê?ÔºåÂ?‰ΩøÁî® HTTP Ê®°Â?');
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
          : '?°Ê???é•??ESP32 Ë®≠Â?'
      );
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">ESP32 Ë®≠Â?</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">?çÁΩÆË®≠Â???é•</p>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Status */}
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
                {esp32Service.getConnectionStatus() ? 'Â∑≤ÈÄ?é•' : '?™ÈÄ?é•'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {currentConfig.host}:{currentConfig.port}
              </p>
            </div>
          </div>

          {/* Host Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ESP32 IP ?∞Â? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="‰æãÂ?: 192.168.1.100"
              disabled={testing}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-300 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              ??é•??ESP32-S3 ?ãÁôº?øÁ? IP ?∞Â?
            </p>
          </div>

          {/* Port Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ??é•??<span className="text-red-500">*</span>
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
              WebSocket ??HTTP API ??é•??
            </p>
          </div>

          {/* WebSocket Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              ??é•?πÂ?
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
                ? 'WebSocketÔºöÁî®?ºÂØ¶?ÇÈ??ëÈÄö‰ø°'
                : 'HTTP APIÔºöÁî®?ºÁ∞°?ÆÁ? REST Ë™øÁî®'
              }
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {connectionStatus === 'connected' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Â∑≤Ê??üÈÄ?é•??ESP32Ôº?/p>
            </div>
          )}

          {/* Loading Status */}
          {connectionStatus === 'connecting' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <div className="animate-spin">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700">Ê≠?ú®??é•?∞Ë®≠??..</p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-sm text-slate-900 mb-2">Ë®≠ÁΩÆÊ≠•È?Ôº?/h4>
            <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
              <li>Á¢∫‰? ESP32-S3 ?ãÁôº?øÂ∑≤‰∏äÂÇ≥Á∂≤È?‰º∫Ê??®‰ª£Á¢?/li>
              <li>Ë®òÈ??ãÁôº?øÁ? IP ?∞Â??åÈÄ?é•??/li>
              <li>Ëº∏ÂÖ•‰∏äËø∞?∞Â??åÈÄ?é•??/li>
              <li>ÈªûÊ??åÊ∏¨Ë©¶‰∏¶‰øùÂ??çÈ?Ë≠âÈÄ?é•</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200/50 bg-slate-50">
          <button
            onClick={onClose}
            disabled={testing}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            ?ñÊ?
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
                <span>Ê∏¨Ë©¶‰∏?..</span>
              </>
            ) : (
              'Ê∏¨Ë©¶‰∏¶‰?Â≠?
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ESP32SettingsModal;

