import React, { useState } from 'react';
import { Phone, XCircle, AlertOctagon } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface AlertOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  onCall: () => void;
}

const AlertOverlay: React.FC<AlertOverlayProps> = ({ isVisible, onDismiss, onCall }) => {
  const [showCamera, setShowCamera] = useState(false);

  if (!isVisible) return null;

  const handleCallClick = () => {
    // Provide tactile feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    // Open camera first
    setShowCamera(true);
  };

  const handlePhotoCaptured = (imageData: string) => {
    // Store photo
    try {
      localStorage.setItem('last_emergency_photo', imageData);
      localStorage.setItem('last_emergency_time', new Date().toISOString());
      console.log('Emergency photo saved locally');
    } catch (e) {
      console.error('Failed to save photo', e);
    }

    setShowCamera(false);
    // Proceed with the call and dismiss the alert
    onCall();
    onDismiss();
  };

  const handleDismiss = () => {
    // Provide tactile feedback for dismiss action
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    onDismiss();
  };

  return (
    <>
      {showCamera && (
        <CameraCapture 
          onCapture={handlePhotoCaptured} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      
      {/* Hide the main overlay content if camera is active to prevent clutter, or keep it behind. 
          Here we keep it behind but since CameraCapture is z-[60] and this is z-50, it works fine. */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-600 animate-in fade-in zoom-in duration-300 ${showCamera ? 'invisible' : 'visible'}`}>
        {/* Background with subtle pulsating opacity */}
        <div className="absolute inset-0 bg-red-700 animate-subtle-fade"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-md w-full">
          {/* Icon with subtle bounce animation */}
          <AlertOctagon className="w-32 h-32 text-white mb-6 animate-subtle-bounce" />
          
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-widest">緊急警報！</h1>
          <p className="text-xl text-red-100 mb-12 font-medium">已偵測到跌倒，正在請求協助。</p>

          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={handleCallClick}
              className="w-full bg-white text-red-600 hover:bg-red-50 py-5 rounded-2xl flex items-center justify-center gap-3 text-xl font-bold shadow-xl transition-transform active:scale-95"
            >
              <Phone className="w-6 h-6" />
              撥打電話給家人
            </button>
            
            <button 
              onClick={handleDismiss}
              className="w-full bg-red-800 text-white hover:bg-red-900 border border-red-400/30 py-4 rounded-2xl flex items-center justify-center gap-3 text-lg font-semibold transition-colors"
            >
              <XCircle className="w-6 h-6" />
              誤報，解除警報
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertOverlay;