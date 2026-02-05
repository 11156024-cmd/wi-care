import React, { useState } from 'react';
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, Heart, 
  Clock, Shield, MessageCircle, Send, X
} from 'lucide-react';
import { lineService } from '../services/WiCare.LineService';

interface CaregiverProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
}

// 預設的長輩資料
const defaultElderlyData = {
  name: '王奶奶',
  age: 78,
  phone: '0912-345-678',
  address: '台北市信義區松山路100號',
  emergencyContact: '王先生 (兒子) 0923-456-789',
  healthConditions: ['高血壓', '糖尿病', '輕度關節炎'],
  lastActivity: new Date()
};

const CaregiverProfileView: React.FC<CaregiverProfileViewProps> = ({ isOpen, onClose }) => {
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const elderlyData = defaultElderlyData;

  const handleTestNotification = async () => {
    setNotificationStatus('sending');
    try {
      const success = await lineService.sendFallAlert();
      if (success) {
        setNotificationStatus('sent');
        alert("測試發送成功！\n(請查看 Console 了解模擬的 API 請求)");
      } else {
        setNotificationStatus('error');
        alert("發送失敗，請檢查 LINE Bot 設定");
      }
    } catch (error) {
      setNotificationStatus('error');
      alert("發送失敗，請檢查設定");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              <h1 className="font-bold text-lg text-slate-800">長輩資料</h1>
            </div>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {elderlyData.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{elderlyData.name}</h2>
                <p className="text-slate-500">{elderlyData.age} 歲</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{elderlyData.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{elderlyData.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  最後活動：{elderlyData.lastActivity.toLocaleString('zh-TW')}
                </span>
              </div>
            </div>
          </div>

          {/* Health Conditions */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="font-semibold text-slate-800">健康狀況</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {elderlyData.healthConditions.map((condition, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm font-medium"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-800">緊急聯絡人</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{elderlyData.emergencyContact}</span>
              <button className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LINE Test */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-slate-800">LINE 通知測試</h3>
            </div>
            <button
              onClick={handleTestNotification}
              disabled={notificationStatus === 'sending'}
              className="w-full py-2.5 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {notificationStatus === 'sending' ? (
                <span>發送中...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>發送測試通知</span>
                </>
              )}
            </button>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-slate-800">今日活動紀錄</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">起床</span>
                <span className="text-sm font-medium text-slate-800">06:30</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">早餐</span>
                <span className="text-sm font-medium text-slate-800">07:15</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">外出散步</span>
                <span className="text-sm font-medium text-slate-800">09:00</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">午休</span>
                <span className="text-sm font-medium text-slate-800">13:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverProfileView;
