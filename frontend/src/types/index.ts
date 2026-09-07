export type UserRole = 'user' | 'admin' | 'superadmin';

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Administrator',
  admin: 'Administrator',
  user: 'Pengguna',
};

export interface FingerprintSlot {
  templateId: number;
  label: string;
  registeredAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  nipNim: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  fingerprintTemplateId?: number;
  fingerprintTemplateIds?: number[];
  fingerprints?: FingerprintSlot[];
  accessibleRoomIds: string[];
  status: 'ACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  createdAt: string;
}

export type DoorStatus = 'OPEN' | 'CLOSED';
export type LockStatus = 'LOCKED' | 'UNLOCKED';
export type RelayStatus = 'ON' | 'OFF';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';

export interface Room {
  id: string;
  name: string;
  code: string;
  description: string;
  deviceId: string;
  location: string;
  ipAddress: string;
  mqttTopicPrefix: string;
  
  // Real-time states
  doorStatus: DoorStatus;
  lockStatus: LockStatus;
  relayStatus: RelayStatus;
  deviceStatus: DeviceStatus;
  isAlarmActive: boolean;
  openDurationSeconds: number;
  maxOpenThresholdSeconds: number;
  
  // Stats
  lastAccessTime: string;
  lastUserAccessed?: string;
  todayAccessCount: number;
  fingerprintCapacity: number;
  usedFingerprints: number;
}

export type ActivityType = 
  | 'FINGERPRINT_AUTH'
  | 'REMOTE_UNLOCK'
  | 'DOOR_OPENED'
  | 'DOOR_CLOSED'
  | 'ALARM_TRIGGERED'
  | 'ALARM_CLEARED'
  | 'DEVICE_ONLINE'
  | 'DEVICE_OFFLINE'
  | 'ENROLLMENT_SUCCESS'
  | 'ENROLLMENT_FAILED';

export type AuthResult = 'SUCCESS' | 'FAILED' | 'SYSTEM' | 'DENIED';

export interface AccessLog {
  id: string;
  eventId: string;
  deviceId: string;
  roomId: string;
  roomName: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  fingerprintTemplateId?: number;
  activityType: ActivityType;
  authResult: AuthResult;
  timestamp: string;
  details: string;
  doorStatusAtEvent?: DoorStatus;
}

export interface MQTTMessage {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  qos: 0 | 1 | 2;
  timestamp: string;
  direction: 'INCOMING' | 'OUTGOING';
}

