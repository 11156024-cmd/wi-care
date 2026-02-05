import { useState, useEffect, useRef } from 'react';

export type RoomSize = 'small' | 'medium' | 'large';
export type InstallLocation = 'master_bath' | 'guest_restroom' | 'bedroom' | 'living_room';

export interface DeviceConfig {
  location: InstallLocation;
  roomSize: RoomSize;
  hasPets: boolean;
  deviceId: string;
  firmwareVersion: string;
  lastCalibrated: string | null;
}

export const useDeviceSetupViewModel = (onClose: () => void) => {
  // Initialize state from localStorage
  const [config, setConfig] = useState<DeviceConfig>({
    location: 'master_bath',
    roomSize: 'medium',
    hasPets: false,
    deviceId: 'ESP32-CSI-A01',
    firmwareVersion: 'v1.0.4',
    lastCalibrated: '2023-10-15T10:00:00.000Z'
  });

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationStep, setCalibrationStep] = useState<string>('');

  // Load saved config
  useEffect(() => {
    const saved = localStorage.getItem('device_setup_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse device config', e);
      }
    }
  }, []);

  const updateConfig = (key: keyof DeviceConfig, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      localStorage.setItem('device_setup_config', JSON.stringify(newConfig));
      return newConfig;
    });
  };

  const startCalibration = () => {
    if (isCalibrating) return;
    
    setIsCalibrating(true);
    setCalibrationProgress(0);
    setCalibrationStep('初始化感測器...');

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    const steps = [
      { p: 10, text: '讀取背景 CSI 訊號...' },
      { p: 30, text: '分析環境多徑效應 (Multipath)...' },
      { p: 60, text: '建立靜態基準模型...' },
      { p: 85, text: '寫入校正參數...' },
      { p: 100, text: '校正完成' }
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      setCalibrationProgress(prev => {
        const next = prev + 2;
        
        // Update status text based on progress
        const step = steps.find(s => s.p >= next && s.p < next + 2);
        if (step) setCalibrationStep(step.text);

        if (next >= 100) {
          clearInterval(interval);
          finishCalibration();
          return 100;
        }
        return next;
      });
    }, 100); // 5 seconds total approx (100ms * 50 steps = 5000ms)
  };

  const finishCalibration = () => {
    setTimeout(() => {
      setIsCalibrating(false);
      setCalibrationProgress(0);
      updateConfig('lastCalibrated', new Date().toISOString());
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      alert("環境校正成功！裝置已針對目前空間進行最佳化。");
    }, 500);
  };

  return {
    config,
    updateConfig,
    isCalibrating,
    calibrationProgress,
    calibrationStep,
    startCalibration
  };
};