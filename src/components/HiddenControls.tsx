import React from 'react';
import { SystemStatus } from '../types';

interface HiddenControlsProps {
  isEnabled?: boolean;
  show?: boolean;
  onToggle?: () => void;
  onStatusChange?: (newStatus: SystemStatus) => void;
  onClose?: () => void;
  onForceSafe?: () => void;
  onForceFall?: () => void;
  esp32Connected?: boolean;
  connectionError?: string;
}

const HiddenControls: React.FC<HiddenControlsProps> = ({ 
  isEnabled = false,
  show = false,
  onStatusChange, 
  onClose,
  onForceSafe, 
  onForceFall 
}) => {
  if (!isEnabled && !show) return null;

  return (
    <>
      {/* Top Left - Force Safe */}
      <div 
        onClick={onForceSafe}
        className="fixed top-0 left-0 w-24 h-24 z-50 cursor-pointer active:bg-green-500/20"
        title="除錯功能：強制安全狀態"
      />

      {/* Top Right - Force Fall */}
      <div 
        onClick={onForceFall}
        className="fixed top-0 right-0 w-24 h-24 z-50 cursor-pointer active:bg-red-500/20"
        title="除錯功能：強制跌倒狀態"
      />
    </>
  );
};

export default HiddenControls;
