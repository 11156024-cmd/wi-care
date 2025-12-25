import React from 'react';
import { SystemStatus } from '../WiCare.Types';

interface HiddenControlsProps {
  isEnabled: boolean;
  onForceSafe: () => void;
  onForceFall: () => void;
}

const HiddenControls: React.FC<HiddenControlsProps> = ({ isEnabled, onForceSafe, onForceFall }) => {
  if (!isEnabled) return null;

  return (
    <>
      {/* Top Left - Force Safe */}
      <div 
        onClick={onForceSafe}
        className="fixed top-0 left-0 w-24 h-24 z-50 cursor-pointer active:bg-green-500/20"
        title="?±è??Ÿèƒ½ï¼šå¼·?¶å???
      ></div>

      {/* Top Right - Force Fall */}
      <div 
        onClick={onForceFall}
        className="fixed top-0 right-0 w-24 h-24 z-50 cursor-pointer active:bg-red-500/20"
        title="?±è??Ÿèƒ½ï¼šå¼·?¶è???
      ></div>
    </>
  );
};

export default HiddenControls;
