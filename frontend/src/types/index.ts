export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED';

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Administrator',
  admin: 'Administrator',
  user: 'Pengguna',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Aktif',
  PENDING_APPROVAL: 'Menunggu Persetujuan',
  REJECTED: 'Ditolak',
  SUSPENDED: 'Dinonaktifkan',
  EXPIRED: 'Masa Akses Berakhir',
};

export interface RegistrationPayload {
  name: string;
  email: string;
  password?: string;
  requestedRoomIds?: string[];
  validFrom?: string;
  validUntil?: string;
}

export interface ApprovalPayload {
  approvedRoomIds: string[];
  validFrom?: string;
  validUntil?: string;
}

export interface FingerprintSlot {
  templateId: number;
  label: string;
  registeredAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  validFrom?: string;
  validUntil?: string; // null / undefined for permanent
  accessibleRoomIds: string[];
  requestedRoomIds?: string[];
  fingerprintTemplateId?: number;
  fingerprintTemplateIds?: number[];
  fingerprints?: FingerprintSlot[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Evaluates whether a user currently has valid active access
 */
export function getUserAccessValidity(user: User): {
  isValid: boolean;
  isExpired: boolean;
  statusText: string;
  remainingText: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
} {
  if (user.status === 'PENDING_APPROVAL') {
    return {
      isValid: false,
      isExpired: false,
      statusText: 'Menunggu Persetujuan Admin',
      remainingText: 'Menunggu verifikasi Superadmin',
      badgeVariant: 'warning',
    };
  }

  if (user.status === 'REJECTED') {
    return {
      isValid: false,
      isExpired: false,
      statusText: 'Permohonan Ditolak',
      remainingText: 'Ditolak oleh administrator',
      badgeVariant: 'danger',
    };
  }

  if (user.status === 'SUSPENDED') {
    return {
      isValid: false,
      isExpired: false,
      statusText: 'Akun Dinonaktifkan',
      remainingText: 'Akun dinonaktifkan oleh administrator',
      badgeVariant: 'danger',
    };
  }

  // If status is ACTIVE, check validUntil
  if (!user.validUntil) {
    return {
      isValid: true,
      isExpired: false,
      statusText: 'Akses Permanen',
      remainingText: 'Tanpa batas waktu (Permanen)',
      badgeVariant: 'success',
    };
  }

  const now = new Date().getTime();
  const expiresAt = new Date(user.validUntil).getTime();
  const diffMs = expiresAt - now;

  if (diffMs <= 0 || user.status === 'EXPIRED') {
    return {
      isValid: false,
      isExpired: true,
      statusText: 'Masa Akses Berakhir',
      remainingText: `Kedaluwarsa pada ${new Date(user.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      badgeVariant: 'danger',
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  let remainingText = '';
  if (totalDays >= 1) {
    const remainingHours = totalHours % 24;
    remainingText = remainingHours > 0 ? `${totalDays} hari ${remainingHours} jam tersisa` : `${totalDays} hari tersisa`;
  } else if (totalHours >= 1) {
    const remainingMins = totalMinutes % 60;
    remainingText = remainingMins > 0 ? `${totalHours} jam ${remainingMins} mnt tersisa` : `${totalHours} jam tersisa`;
  } else {
    remainingText = `${Math.max(1, totalMinutes)} menit tersisa`;
  }

  return {
    isValid: true,
    isExpired: false,
    statusText: 'Akses Aktif',
    remainingText,
    badgeVariant: totalHours <= 2 ? 'warning' : 'success',
  };
}

export type DoorStatus = 'OPEN' | 'CLOSED';
export type LockStatus = 'LOCKED' | 'UNLOCKED';
export type RelayStatus = 'ON' | 'OFF';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';

export interface Room {
  id: string;
  name: string;
  description: string;
  deviceId: string;
  usedFingerprints: number;
  createdAt: string;
  updatedAt: string;

  // Real-time live status from WebSocket/MQTT
  doorStatus?: DoorStatus;
  lockStatus?: LockStatus;
  relayStatus?: RelayStatus;
  deviceStatus?: DeviceStatus;
  isAlarmActive?: boolean;
  openDurationSeconds?: number;
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
  roomId?: string;
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
