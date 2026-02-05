import React, { useState, useEffect } from 'react';

export interface CaregiverProfile {
  name: string;
  phone: string;
  lineChannelToken: string; // Changed from lineToken
  lineUserId: string;       // New field for Bot push target
  avatarUrl: string | null;
}

export const useCaregiverViewModel = (onSaveSuccess: () => void) => {
  // Initialize state from localStorage
  const [profile, setProfile] = useState<CaregiverProfile>({
    name: '',
    phone: '',
    lineChannelToken: '',
    lineUserId: '',
    avatarUrl: null,
  });

  const [isDirty, setIsDirty] = useState(false);

  // Load data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('caregiver_profile');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Migration logic: ensure new fields exist if loading old data
        setProfile({
            name: parsed.name || '',
            phone: parsed.phone || '',
            lineChannelToken: parsed.lineChannelToken || parsed.lineToken || '', // Fallback for migration
            lineUserId: parsed.lineUserId || '',
            avatarUrl: parsed.avatarUrl || null
        });
      } catch (e) {
        console.error('Failed to parse profile data', e);
      }
    }
  }, []);

  // Validation Logic
  const isPhoneValid = (phone: string): boolean => {
    // Simple regex for 10-digit number (e.g., 0912345678)
    const phoneRegex = /^09\d{8}$/; 
    return phoneRegex.test(phone);
  };

  // Valid if name, phone, and at least partial Line config is present (optional but recommended)
  const isValid = profile.name.trim().length > 0 && isPhoneValid(profile.phone);

  // Actions
  const updateField = (field: keyof CaregiverProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const saveProfile = () => {
    if (!isValid) return;
    
    localStorage.setItem('caregiver_profile', JSON.stringify(profile));
    setIsDirty(false);
    
    // Simulate API call or success feedback
    if (navigator.vibrate) navigator.vibrate(50);
    onSaveSuccess();
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

  return {
    profile,
    updateField,
    isPhoneValid: isPhoneValid(profile.phone),
    isValid,
    saveProfile,
    handleAvatarUpload,
    isDirty
  };
};