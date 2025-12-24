import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        try {
          // First try to get the back/environment camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
        } catch (err) {
          console.warn('Environment camera not found, trying default camera.', err);
          // Fallback to any available video source (e.g., webcam on laptop)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
        
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        // If both attempts fail
        setError('無法存取相機。請確認裝置有相機且已允許權限。');
        console.error('Camera access error:', err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Provide haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-10">
        <h2 className="text-white font-semibold text-lg">緊急回報：拍攝現場</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 text-white backdrop-blur-sm"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4">{error}</p>
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-700 rounded-lg"
            >
              關閉
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            onLoadedMetadata={() => videoRef.current?.play()}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-black p-8 flex justify-center items-center pb-12">
        <button
          onClick={handleCapture}
          disabled={!isStreaming}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-16 h-16 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;