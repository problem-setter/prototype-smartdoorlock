import { createContext } from 'react';
import { User, Room, AccessLog, MQTTMessage, UserRole } from '../types';

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  rooms: Room[];
  logs: AccessLog[];
  mqttMessages: MQTTMessage[];
  selectedRoomId: string | null;
  
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setSelectedRoomId: (id: string | null) => void;
  
  triggerRemoteUnlock: (roomId: string) => Promise<boolean>;
  forceRelock: (roomId: string) => void;
  toggleDoorPhysics: (roomId: string) => void;
  toggleDeviceOnline: (roomId: string) => void;
  pingDevice: (roomId: string) => Promise<boolean>;
  requestRoomAccess: (roomId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  simulateFingerprintScan: (roomId: string, user: User | null, isAuthorized?: boolean) => boolean;
  clearAlarm: (roomId: string) => void;
  
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  updateUserStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED') => void;
  deleteUser: (userId: string) => void;
  enrollFingerprint: (userId: string, roomId: string, label?: string) => Promise<{ success: boolean; templateId: number; message?: string }>;
  updateFingerprintLabel: (userId: string, templateId: number, newLabel: string) => void;
  removeFingerprint: (userId: string, templateId: number) => void;
  clearMqttLogs: () => void;
  exportLogs: (format: 'json' | 'csv') => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
