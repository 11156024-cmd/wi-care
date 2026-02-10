import React from 'react';
import { ArrowLeft, FileHeart, Heart, Activity, Pill, AlertTriangle, X } from 'lucide-react';

interface ElderlyHealthPassportProps {
  isOpen: boolean;
  onClose: () => void;
}

// 預設的使用者健康資料
const defaultUserData = {
  name: '王奶奶',
  bloodType: 'A+',
  allergies: ['盤尼西林', '海鮮'],
  medications: ['降血壓藥 (早晚各一次)', '血糖控制藥 (飯前)', '維他命D'],
  conditions: ['高血壓', '第二型糖尿病', '輕度骨質疏鬆'],
  emergencyContact: {
    name: '王先生',
    phone: '0923-456-789',
    relationship: '兒子'
  }
};

const ElderlyHealthPassport: React.FC<ElderlyHealthPassportProps> = ({ isOpen, onClose }) => {
  const userData = defaultUserData;

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
              <FileHeart className="w-5 h-5 text-rose-500" />
              <h1 className="font-bold text-lg text-slate-800">健康護照</h1>
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
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {userData.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{userData.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium">
                    血型：{userData.bloodType}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-800">過敏史</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {userData.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200"
                >
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-slate-800">目前用藥</h3>
            </div>
            <div className="space-y-2">
              {userData.medications.map((med, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span className="text-sm text-slate-700">{med}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health Conditions */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="font-semibold text-slate-800">健康狀況</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {userData.conditions.map((condition, index) => (
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
              <Activity className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-slate-800">緊急聯絡人</h3>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{userData.emergencyContact.name}</p>
                  <p className="text-sm text-slate-500">{userData.emergencyContact.relationship}</p>
                </div>
                <a 
                  href={`tel:${userData.emergencyContact.phone}`}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  {userData.emergencyContact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElderlyHealthPassport;
