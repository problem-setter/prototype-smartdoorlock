import {
  User,
  Room,
  AccessLog,
  RegistrationPayload,
  ApprovalPayload,
  UserRole,
  ActivityType,
  AuthResult,
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TOKEN_KEY = 'smart_door_lock_jwt';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LogFilterParams {
  roomId?: string;
  userId?: string;
  activityType?: ActivityType;
  authResult?: AuthResult;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface LogListResponse {
  logs: AccessLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface LogStatsResponse {
  totalEventsToday: number;
  successfulAccesses: number;
  failedAttempts: number;
  activeAlarmsCount: number;
  successRatePercent: number;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && (data.error || data.message)) {
        errorMsg = data.error || data.message;
      }
    } catch {
      // not json
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // --- Auth ---
  async login(credentials: { email?: string; password?: string }): Promise<LoginResponse> {
    const payload = {
      email: credentials.email || '',
      password: credentials.password || '',
    };
    const res = await request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async register(payload: RegistrationPayload): Promise<RegisterResponse> {
    return await request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        requestedRoomIds: payload.requestedRoomIds,
        validFrom: payload.validFrom,
        validUntil: payload.validUntil,
      }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return await request<{ user: User }>('/api/auth/me');
  },

  // --- Rooms ---
  async getRooms(): Promise<Room[]> {
    return await request<Room[]>('/api/rooms');
  },

  async getRoom(id: string): Promise<Room> {
    return await request<Room>(`/api/rooms/${id}`);
  },

  async requestAccess(roomId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>(`/api/rooms/${roomId}/request-access`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async remoteUnlock(roomId: string, reason: string = 'Remote Unlock Dashboard'): Promise<Room> {
    return await request<Room>(`/api/rooms/${roomId}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async forceLock(roomId: string): Promise<Room> {
    return await request<Room>(`/api/rooms/${roomId}/lock`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async clearAlarm(roomId: string): Promise<Room> {
    return await request<Room>(`/api/rooms/${roomId}/clear-alarm`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async updateRoomSettings(roomId: string, settings: {
    name?: string;
    description?: string;
  }): Promise<Room> {
    return await request<Room>(`/api/rooms/${roomId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // --- Users (Admin/Superadmin) ---
  async getUsers(): Promise<User[]> {
    return await request<User[]>('/api/users');
  },

  async getUser(id: string): Promise<User> {
    return await request<User>(`/api/users/${id}`);
  },

  async createUser(userData: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    accessibleRoomIds: string[];
    validFrom?: string;
    validUntil?: string;
  }): Promise<User> {
    return await request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return await request<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  async approveUser(id: string, payload: ApprovalPayload): Promise<User> {
    return await request<User>(`/api/users/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        approvedRoomIds: payload.approvedRoomIds,
        validFrom: payload.validFrom,
        validUntil: payload.validUntil,
      }),
    });
  },

  async rejectUser(id: string, reason: string): Promise<User> {
    return await request<User>(`/api/users/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason: reason }),
    });
  },

  async suspendUser(id: string): Promise<User> {
    return await request<User>(`/api/users/${id}/suspend`, {
      method: 'POST',
    });
  },

  async activateUser(id: string): Promise<User> {
    return await request<User>(`/api/users/${id}/activate`, {
      method: 'POST',
    });
  },

  async addFingerprint(userId: string, slot: { templateId: number; label: string; roomId?: string }): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/users/${userId}/fingerprints`, {
      method: 'POST',
      body: JSON.stringify(slot),
    });
  },

  async deleteFingerprint(userId: string, templateId: number): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/users/${userId}/fingerprints/${templateId}`, {
      method: 'DELETE',
    });
  },

  // --- Logs ---
  async getLogs(params: LogFilterParams = {}): Promise<LogListResponse> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    if (params.roomId) query.set('roomId', params.roomId);
    if (params.userId) query.set('userId', params.userId);
    if (params.activityType) query.set('activityType', params.activityType);
    if (params.authResult) query.set('authResult', params.authResult);
    if (params.search) query.set('search', params.search);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const queryString = query.toString();
    const endpoint = `/api/logs${queryString ? `?${queryString}` : ''}`;
    return await request<LogListResponse>(endpoint);
  },

  async getLogStats(): Promise<LogStatsResponse> {
    return await request<LogStatsResponse>('/api/logs/stats');
  },

  // --- Hardware ---
  async getDevices(): Promise<Array<{ deviceId: string; roomId: string; roomName: string; usedFingerprints: number }>> {
    return await request<Array<{ deviceId: string; roomId: string; roomName: string; usedFingerprints: number }>>('/api/hardware/devices');
  },

  async startEnrollment(deviceId: string, templateId: number, userId: string): Promise<{ message: string; deviceId: string; templateId: number; userId: string }> {
    return await request<{ message: string; deviceId: string; templateId: number; userId: string }>('/api/hardware/enroll/start', {
      method: 'POST',
      body: JSON.stringify({ deviceId, templateId, userId }),
    });
  },

  async cancelEnrollment(deviceId: string): Promise<{ message: string }> {
    return await request<{ message: string }>('/api/hardware/enroll/cancel', {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  },

  // --- Health check ---
  async checkHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    return await request<{ status: string; service: string; timestamp: string }>('/health');
  },
};
