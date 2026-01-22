import React from 'react';
import { X, Server, Wifi, Bell, Volume2, Vibrate } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    notificationsEnabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
  };
  onSettingsChange: (settings: SettingsModalProps['settings']) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof settings) => {
    if (key === 'sensitivity') return;
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleSensitivityChange = (value: 'low' | 'medium' | 'high') => {
    onSettingsChange({
      ...settings,
      sensitivity: value
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700">系統設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-800">聲音警報</p>
                <p className="text-xs text-slate-500">跌倒時播放警報聲</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('soundEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Vibrate className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-800">震動提醒</p>
                <p className="text-xs text-slate-500">跌倒時震動手機</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('vibrationEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.vibrationEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-800">推播通知</p>
                <p className="text-xs text-slate-500">發送推播通知</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('notificationsEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-800">偵測靈敏度</p>
                <p className="text-xs text-slate-500">調整跌倒偵測的敏感程度</p>
              </div>
            </div>
            
            <div className="flex gap-2 ml-11">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleSensitivityChange(level)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                    settings.sensitivity === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level === 'low' ? '低' : level === 'medium' ? '中' : '高'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
