import React from 'react';
import { AlertTriangle, Phone, X, Clock } from 'lucide-react';

interface AlertOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  fallData?: {
    timestamp: Date;
    severity: 'high' | 'medium' | 'low';
    location?: string;
  };
}

const AlertOverlay: React.FC<AlertOverlayProps> = ({ isVisible, onDismiss, fallData }) => {
  if (!isVisible) return null;

  const severityConfig = {
    high: {
      bg: 'from-red-600 to-red-700',
      text: '嚴重跌倒警報',
      pulse: 'animate-pulse'
    },
    medium: {
      bg: 'from-orange-500 to-orange-600',
      text: '跌倒警報',
      pulse: ''
    },
    low: {
      bg: 'from-yellow-500 to-yellow-600',
      text: '輕微跌倒警報',
      pulse: ''
    }
  };

  const config = severityConfig[fallData?.severity || 'high'];

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className={`bg-gradient-to-br ${config.bg} rounded-3xl shadow-2xl w-full max-w-sm p-6 ${config.pulse}`}>
          <div className="flex flex-col items-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <AlertTriangle className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{config.text}</h2>
            
            {fallData && (
              <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                <Clock className="w-4 h-4" />
                <span>
                  {fallData.timestamp.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            )}
            
            <p className="text-center text-white/90 mb-6">
              系統偵測到可能的跌倒事件，請確認長輩的安全狀況。
            </p>
            
            <div className="w-full space-y-3">
              <button
                onClick={() => window.location.href = 'tel:119'}
                className="w-full py-3 bg-white text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <Phone className="w-5 h-5" />
                撥打 119
              </button>
              
              <button
                onClick={onDismiss}
                className="w-full py-3 bg-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
                誤報，解除警報
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertOverlay;
