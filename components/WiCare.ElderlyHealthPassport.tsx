import React from 'react';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  AlertTriangle, 
  Activity, 
  Stethoscope,
  FileHeart
} from 'lucide-react';
import { useElderlyViewModel, PREDEFINED_CONDITIONS } from '../hooks/useElderlyViewModel';

interface ElderlyHealthPassportProps {
  isOpen: boolean;
  onClose: () => void;
}

const ElderlyHealthPassport: React.FC<ElderlyHealthPassportProps> = ({ isOpen, onClose }) => {
  const {
    profile,
    updateField,
    toggleCondition,
    showHighRiskBanner,
    handleAvatarUpload,
    savePassport,
    isValid
  } = useElderlyViewModel(onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
      
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
            <FileHeart className="w-5 h-5 text-rose-500" />
            <h1 className="font-bold text-lg text-slate-800">?∑Ëº©?•Â∫∑Ë≥áÊ???/h1>
        </div>
        <div className="w-10" /> 
      </div>

      {/* Warning Banner - Absolute positioned or Sticky under header */}
      {showHighRiskBanner && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-start gap-3 animate-in slide-in-from-top-2 duration-500">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                  <p className="text-sm font-bold text-amber-700">È´òÈ¢®?™Ë≠¶Á§?/p>
                  <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                      Ê≠§Èï∑Ëº©Â±¨?ºË??íÈ?È¢®Èö™Áæ§„ÄÇÁ≥ªÁµ±Âª∫Ë≠∞ÊÇ®?ãÂ??åÈ??àÊ?Â∫¶ÂÅµÊ∏¨„ÄçÊ®°Âºè‰ª•Á¢∫‰?ÂÆâÂÖ®??                  </p>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6">

          {/* 1. Top Info Card (Medical ID Style) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            {/* Decorative Top Border */}
            <div className="h-2 w-full bg-gradient-to-r from-rose-400 to-rose-600" />
            
            <div className="p-6">
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                            {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Elderly Avatar" className="w-full h-full object-cover" />
                            ) : (
                            <User className="w-10 h-10 text-slate-300" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-rose-600 transition-colors">
                            <Camera className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                    </div>

                    {/* Basic Fields */}
                    <div className="flex-1 w-full space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Á®±Âëº (Nickname)
                            </label>
                            <input 
                                type="text"
                                value={profile.nickname}
                                onChange={(e) => updateField('nickname', e.target.value)}
                                placeholder="‰æãÂ?ÔºöÁà∫??
                                className="w-full text-xl font-bold text-slate-800 border-b border-slate-200 focus:border-rose-500 focus:outline-none py-1 placeholder:font-normal placeholder:text-slate-300 bg-transparent transition-colors"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Âπ¥ÈΩ°
                                </label>
                                <input 
                                    type="number"
                                    value={profile.age}
                                    onChange={(e) => updateField('age', e.target.value)}
                                    placeholder="80"
                                    className="w-full font-mono text-slate-700 border-b border-slate-200 focus:border-rose-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    ?ßÂà•
                                </label>
                                <div className="flex gap-2 mt-1">
                                    {(['male', 'female'] as const).map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => updateField('gender', g)}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                                profile.gender === g 
                                                ? 'bg-slate-800 text-white' 
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                        >
                                            {g === 'male' ? '?? : 'Â•?}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* 2. Medical Tags Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
                <Stethoscope className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    ?ÖÂè≤?áÈ¢®?™Â?Â≠?(Medical Conditions)
                </h3>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs text-slate-400 mb-4">
                    Ë´ãÈ??∏Èï∑Ëº©Áèæ?âÁ??•Â∫∑?ÄÊ≥ÅÔ?Á≥ªÁµ±Â∞á‰?Ê≠§Ë™ø??AI ?µÊ∏¨Ê¨äÈ???                </p>

                {/* FlowLayout using Flex wrap */}
                <div className="flex flex-wrap gap-2.5">
                    {PREDEFINED_CONDITIONS.map((condition) => {
                        const isSelected = profile.conditions.includes(condition.id);
                        return (
                            <button
                                key={condition.id}
                                onClick={() => toggleCondition(condition.id)}
                                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-95
                                    ${isSelected 
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' 
                                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                                    }
                                `}
                            >
                                {condition.label}
                            </button>
                        );
                    })}
                </div>
            </div>
          </div>

          {/* 3. System Feedback Preview */}
          <div className="bg-slate-100/50 rounded-xl p-4 border border-slate-200/50">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">?ÆÂ?È¢®Èö™Ë©ï‰º∞</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${showHighRiskBanner ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {showHighRiskBanner ? 'High Risk' : 'Normal'}
                </span>
             </div>
             <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${showHighRiskBanner ? 'bg-red-500 w-3/4' : 'bg-green-500 w-1/4'}`} 
                />
             </div>
             <p className="text-[10px] text-slate-400 mt-2 text-right">
                AI Sensitivity Level: {showHighRiskBanner ? '0.85 (High)' : '0.5 (Standard)'}
             </p>
          </div>

          <div className="h-4" /> {/* Spacer */}

          <button
            onClick={savePassport}
            disabled={!isValid}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
              isValid 
                ? 'bg-slate-900 text-white shadow-slate-900/20' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Activity className="w-5 h-5" />
            ?¥Êñ∞?•Â∫∑Ë≥áÊ???          </button>

        </div>
      </div>
    </div>
  );
};

export default ElderlyHealthPassport;
