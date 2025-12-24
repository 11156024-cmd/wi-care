import React, { useState } from 'react';
import { User, Camera, ArrowLeft, HelpCircle, Check, AlertCircle, Send, Bot } from 'lucide-react';
import { useCaregiverViewModel } from '../hooks/useCaregiverViewModel';
import { lineService } from '../services/lineService';

interface CaregiverProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const CaregiverProfileView: React.FC<CaregiverProfileViewProps> = ({ isOpen, onClose }) => {
  const { 
    profile, 
    updateField, 
    isValid, 
    isPhoneValid, 
    saveProfile, 
    handleAvatarUpload 
  } = useCaregiverViewModel(onClose);

  const [showLineHelp, setShowLineHelp] = useState(false);
  const [isTestingLine, setIsTestingLine] = useState(false);

  const handleTestLine = async () => {
    if (!profile.lineChannelToken || !profile.lineUserId) {
        alert("請先輸入 Channel Token 與 User ID");
        return;
    }
    setIsTestingLine(true);
    const success = await lineService.sendTestMessage(profile.lineChannelToken, profile.lineUserId);
    setIsTestingLine(false);
    
    if (success) {
        alert("測試發送成功！\n(請開啟 Console 查看模擬的 API 請求)");
    } else {
        alert("發送失敗，請檢查設定。");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg text-slate-800">照顧者資料</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-8">

          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-blue-600 transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <p className="mt-3 text-sm text-slate-500">點擊更換大頭貼</p>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* Name Input */}
            <div className="p-4 border-b border-slate-50">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                姓名
              </label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="請輸入您的姓名"
                className="w-full text-lg text-slate-800 placeholder:text-slate-300 focus:outline-none"
              />
            </div>

            {/* Phone Input */}
            <div className="p-4 border-b border-slate-50 relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                手機號碼
              </label>
              <input 
                type="tel" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={profile.phone}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    updateField('phone', val);
                }}
                placeholder="0912345678"
                maxLength={10}
                className={`w-full text-lg focus:outline-none ${
                    profile.phone && !isPhoneValid ? 'text-red-500' : 'text-slate-800'
                }`}
              />
              {profile.phone.length > 0 && (
                  <div className="absolute right-4 top-9">
                      {isPhoneValid ? (
                          <Check className="w-5 h-5 text-green-500" />
                      ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                  </div>
              )}
            </div>

            {/* Line Bot Settings */}
            <div className="p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-[#00B900]" />
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Line Bot 設定 (Messaging API)
                </label>
                <button 
                  onClick={() => setShowLineHelp(!showLineHelp)}
                  className="ml-auto text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="underline">如何設定？</span>
                </button>
              </div>
              
              {showLineHelp && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg leading-relaxed animate-in fade-in zoom-in-95 duration-200 border border-blue-100">
                      <p className="font-bold mb-1">請前往 <a href="https://developers.line.biz/console/" target="_blank" className="underline text-blue-600">LINE Developers Console</a>：</p>
                      <ul className="list-decimal pl-4 space-y-1 opacity-90">
                          <li>建立一個 Provider 與 Messaging API Channel。</li>
                          <li>在 <strong>Messaging API</strong> 分頁，產生 <strong>Channel access token</strong>。</li>
                          <li>在 <strong>Basic settings</strong> 分頁，捲到底部找到 <strong>Your user ID</strong> (開發者專用)。</li>
                      </ul>
                      <p className="mt-2 text-[10px] text-blue-600/70">* 註：正式上線需透過 Webhook 獲取一般用戶 ID。</p>
                  </div>
              )}

              <div className="space-y-3">
                {/* Channel Access Token */}
                <div>
                   <label className="text-[10px] text-slate-400 font-bold mb-1 block">Channel Access Token</label>
                   <textarea
                        value={profile.lineChannelToken}
                        onChange={(e) => updateField('lineChannelToken', e.target.value)}
                        placeholder="請貼上長串的 Access Token..."
                        className="w-full h-16 text-xs font-mono text-slate-600 bg-white border border-slate-200 rounded px-2 py-2 focus:outline-none focus:border-[#00B900] transition-all resize-none"
                    />
                </div>

                {/* User ID */}
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-bold mb-1 block">Target User ID</label>
                        <input
                            type="text"
                            value={profile.lineUserId}
                            onChange={(e) => updateField('lineUserId', e.target.value)}
                            placeholder="U1234abcd..."
                            className="w-full text-xs font-mono text-slate-600 bg-white border border-slate-200 rounded px-2 py-2 focus:outline-none focus:border-[#00B900] transition-all"
                        />
                    </div>
                    <button
                        onClick={handleTestLine}
                        disabled={isTestingLine || !profile.lineChannelToken || !profile.lineUserId}
                        className="bg-[#00B900] hover:bg-[#009900] text-white p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[34px] w-[34px] flex items-center justify-center shrink-0 shadow-sm"
                        title="測試發送"
                    >
                        <Send className={`w-3.5 h-3.5 ${isTestingLine ? 'animate-pulse' : ''}`} />
                    </button>
                </div>
              </div>

            </div>

          </div>

          {/* Submit Button */}
          <button
            onClick={saveProfile}
            disabled={!isValid}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
              isValid 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            儲存設定
          </button>

        </div>
      </div>
    </div>
  );
};

export default CaregiverProfileView;