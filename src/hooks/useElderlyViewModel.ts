import React, { useState, useEffect } from 'react';

export interface MedicalCondition {
  id: string;
  label: string;
  isRiskFactor: boolean; // Triggers high sensitivity warning
}

export interface ElderlyProfile {
  nickname: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  avatarUrl: string | null;
  conditions: string[]; // Array of Condition IDs
}

export const PREDEFINED_CONDITIONS: MedicalCondition[] = [
  { id: 'hypertension', label: '高血壓', isRiskFactor: true },
  { id: 'diabetes', label: '糖尿病', isRiskFactor: false },
  { id: 'osteoporosis', label: '骨質疏鬆', isRiskFactor: false }, // Affects injury severity, not necessarily fall probability, but kept false for specific logic demo
  { id: 'fall_history', label: '曾有跌倒紀錄', isRiskFactor: true },
  { id: 'mobility', label: '行動不便', isRiskFactor: true },
  { id: 'heart_disease', label: '心臟病', isRiskFactor: true },
  { id: 'dementia', label: '失智症', isRiskFactor: false },
  { id: 'visual_impairment', label: '視力障礙', isRiskFactor: false },
];

export const useElderlyViewModel = (onSaveSuccess: () => void) => {
  const [profile, setProfile] = useState<ElderlyProfile>({
    nickname: '',
    age: '',
    gender: 'male',
    avatarUrl: null,
    conditions: [],
  });

  const [showHighRiskBanner, setShowHighRiskBanner] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem('elderly_passport');
    if (savedData) {
      try {
        setProfile(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse elderly profile', e);
      }
    }
  }, []);

  // Update banner visibility whenever conditions change
  useEffect(() => {
    const hasRiskFactor = profile.conditions.some(id => {
      const condition = PREDEFINED_CONDITIONS.find(c => c.id === id);
      return condition?.isRiskFactor;
    });
    setShowHighRiskBanner(hasRiskFactor);
  }, [profile.conditions]);

  const updateField = (field: keyof ElderlyProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleCondition = (conditionId: string) => {
    setProfile(prev => {
      const exists = prev.conditions.includes(conditionId);
      let newConditions;
      if (exists) {
        newConditions = prev.conditions.filter(id => id !== conditionId);
      } else {
        newConditions = [...prev.conditions, conditionId];
      }
      return { ...prev, conditions: newConditions };
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('avatarUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const savePassport = () => {
    if (!profile.nickname || !profile.age) return;
    
    localStorage.setItem('elderly_passport', JSON.stringify(profile));
    
    // Feedback
    if (navigator.vibrate) navigator.vibrate(50);
    onSaveSuccess();
  };

  return {
    profile,
    updateField,
    toggleCondition,
    showHighRiskBanner,
    handleAvatarUpload,
    savePassport,
    isValid: profile.nickname.length > 0 && profile.age.length > 0
  };
};