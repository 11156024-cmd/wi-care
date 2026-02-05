export enum SystemStatus {
  SAFE = 'SAFE',
  FALL = 'FALL',
  OFFLINE = 'OFFLINE'
}

export interface DeviceData {
  status: 'safe' | 'fall';
  timestamp: string;
  device_id: string;
}

export interface DashboardStats {
  lastActivity: string;
  activityHours: number;
}

export type SceneMode = 'bathroom' | 'living_room';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'elderly' | 'caregiver';
  emergencyContact: string;
  address: string;
  dateOfBirth: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'elderly' | 'caregiver';
  emergencyContact: string;
  address: string;
  dateOfBirth: string;
}