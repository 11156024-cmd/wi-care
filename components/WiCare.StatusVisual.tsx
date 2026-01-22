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

const Container: React.FC<ContainerProps> = ({ children, className = "" }) => (
  <div className={`relative w-full max-w-[260px] sm:max-w-[300px] aspect-square mx-auto flex items-center justify-center ${className}`}>
    {children}
  </div>
);

const StatusVisual: React.FC<StatusVisualProps> = ({ status }) => {
  if (status === SystemStatus.FALL) {
    return (
      <Container>
        {/* Professional Danger Rings */}
        <div className="absolute inset-0 border-2 border-red-200 rounded-full animate-ping opacity-40"></div>
        <div className="absolute inset-4 border border-red-300 rounded-full animate-pulse"></div>
        <div className="absolute inset-8 border border-red-200 rounded-full"></div>
        
        {/* Center Alert Card */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center bg-white rounded-2xl p-8 shadow-xl border border-red-100">
             <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-4">
               <AlertTriangle className="w-12 h-12 sm:w-14 sm:h-14 text-red-500 animate-pulse" />
             </div>
             <p className="text-xl sm:text-2xl font-bold text-red-600 tracking-tight">
               緊急警報
             </p>
             <p className="text-red-400 text-sm mt-1">偵測到跌倒事件</p>
        </div>
      </Container>
    );
  }

  if (status === SystemStatus.OFFLINE) {
    return (
      <Container>
        {/* Offline rings */}
        <div className="absolute inset-0 border border-slate-200 rounded-full"></div>
        <div className="absolute inset-8 border border-slate-100 rounded-full"></div>
        
        <div className="relative z-10 bg-white rounded-2xl p-8 flex flex-col items-center shadow-lg border border-slate-100">
            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Activity className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
            <p className="text-slate-600 font-semibold text-base sm:text-lg">連線中</p>
            <div className="flex gap-1.5 mt-3">
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
      </Container>
    );
  }

  // Safe Status - Professional Clean Style
  return (
    <Container>
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full opacity-60"></div>
      
      {/* Clean circular rings */}
      <div className="absolute inset-0 border border-blue-100 rounded-full"></div>
      <div className="absolute inset-4 border border-emerald-100 rounded-full"></div>
      <div className="absolute inset-8 border border-blue-50 rounded-full"></div>
      
      {/* Subtle pulse ring */}
      <div className="absolute inset-2 border border-emerald-200/50 rounded-full animate-ping opacity-30" style={{ animationDuration: '3s' }}></div>
      
      {/* Small indicator dots */}
      <div className="absolute inset-0">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-sm"></div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
        <div className="absolute top-1/2 left-2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
      </div>
      
      {/* Center Hub - Clean Professional Card */}
      <div className="relative z-10 p-6 sm:p-8 bg-white rounded-2xl flex flex-col items-center justify-center aspect-square w-[60%] shadow-lg border border-slate-100">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-md mb-3">
          <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
        </div>
        <p className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
          安全
        </p>
        <p className="text-slate-400 text-xs mt-1">系統監控中</p>
      </div>
    </Container>
  );
};

export default StatusVisual;
