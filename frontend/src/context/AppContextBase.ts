import { createContext } from 'react';
import { User, Room, AccessLog, MQTTMessage, RegistrationPayload, ApprovalPayload, UserStatus } from '../types';
import { ConnectionState } from '../services/hardwareService';

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  rooms: Room[];
  logs: AccessLog[];
  mqttMessages: MQTTMessage[];
  selectedRoomId: string | null;
  connectionState: ConnectionState;

  login: (user: User) => { success: boolean; message?: string };
  logout: () => void;
  setSelectedRoomId: (id: string | null) => void;

  triggerRemoteUnlock: (roomId: string) => Promise<boolean>;
  forceRelock: (roomId: string) => void;
  requestRoomAccess: (roomId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  clearAlarm: (roomId: string) => void;

  connectMqtt: (brokerUrl?: string) => void;
  disconnectMqtt: () => void;
  connectSerial: (baudRate?: number) => Promise<boolean>;
  disconnectSerial: () => Promise<void>;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  registerUser: (payload: RegistrationPayload) => Promise<{ success: boolean; message: string; user: User }>;
  approveUserRegistration: (userId: string, payload: ApprovalPayload) => Promise<{ success: boolean; message: string }>;
  rejectUserRegistration: (userId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  extendUserAccess: (userId: string, payload: ApprovalPayload) => Promise<{ success: boolean; message: string }>;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  deleteUser: (userId: string) => void;
  enrollFingerprint: (userId: string, roomId: string, label?: string) => Promise<{ success: boolean; templateId: number; message?: string }>;
  cancelEnrollFingerprint: (roomId: string) => void;
  updateFingerprintLabel: (userId: string, templateId: number, newLabel: string) => void;
  removeFingerprint: (userId: string, templateId: number) => void;
  clearMqttLogs: () => void;
  exportLogs: (format: 'json' | 'csv') => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

