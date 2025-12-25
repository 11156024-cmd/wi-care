import React from 'react';
import { ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { SystemStatus } from '../WiCare.Types';

interface StatusVisualProps {
  status: SystemStatus;
}

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// Common wrapper ensuring centering and max-width management
// Moved outside to correctly type as a React Component and avoid TS errors about missing children prop
const Container: React.FC<ContainerProps> = ({ children, className = "" }) => (
  <div className={`relative w-full max-w-[240px] sm:max-w-[280px] aspect-square mx-auto flex items-center justify-center ${className}`}>
    {children}
  </div>
);

const StatusVisual: React.FC<StatusVisualProps> = ({ status }) => {
  if (status === SystemStatus.FALL) {
    return (
      <Container>
        {/* Pulsing Red Circles - Use percentage/inset to fill container */}
        <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
        <div className="absolute inset-4 bg-red-500 rounded-full opacity-30 animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
             <AlertTriangle className="w-[35%] h-[35%] text-red-600 animate-urgent" />
             <p className="mt-2 sm:mt-4 text-xl sm:text-2xl font-bold text-red-700 animate-bounce whitespace-nowrap">?µæ¸¬?°è??’ï?</p>
        </div>
      </Container>
    );
  }

  if (status === SystemStatus.OFFLINE) {
    return (
      <Container className="bg-gray-100 rounded-full border-4 border-gray-300">
        <div className="flex flex-col items-center">
            <Activity className="w-[30%] h-[30%] text-gray-400" />
            <p className="mt-2 text-gray-500 font-medium text-sm sm:text-base">???ä¸?..</p>
        </div>
      </Container>
    );
  }

  // Safe Status
  return (
    <Container className="bg-green-50 rounded-full border-4 border-green-200 shadow-lg">
      {/* Rotating Border - Using inset percentages */}
      <div className="absolute inset-2 sm:inset-3 border border-green-100 rounded-full animate-[spin_10s_linear_infinite]"></div>
      
      <div className="relative z-10 p-4 sm:p-6 bg-white rounded-full shadow-sm flex items-center justify-center aspect-square w-[60%]">
        <ShieldCheck className="w-full h-full text-green-500 p-2" />
      </div>
      <div className="absolute bottom-[15%] left-0 right-0 text-center">
         <p className="text-lg sm:text-2xl font-bold text-green-600 tracking-tight">?€?‹å???/p>
      </div>
    </Container>
  );
};

export default StatusVisual;
