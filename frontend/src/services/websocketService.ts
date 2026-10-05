import { Room, AccessLog, User, DoorStatus } from '../types';
import { API_BASE_URL } from './api';

export type WSEventType =
  | 'ROOM_UPDATED'
  | 'LOG_CREATED'
  | 'USER_UPDATED'
  | 'ALARM_TRIGGERED'
  | 'ALARM_CLEARED'
  | 'ENROLL_STATUS'
  | 'DEVICE_STATUS'
  | 'HEARTBEAT';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: string;
}

export interface WSEnrollStatusPayload {
  deviceId: string;
  step: 1 | 2 | 3 | 4;
  status:
    | 'WAIT_FINGER_1'
    | 'IMAGE_1_OK'
    | 'LIFT_FINGER'
    | 'WAIT_FINGER_2'
    | 'IMAGE_2_OK'
    | 'CREATE_MODEL_OK'
    | 'STORE_OK'
    | 'TIMEOUT'
    | 'ERROR'
    | 'CANCELLED';
  templateId?: number;
  message?: string;
  timestamp?: string;
}

export interface WSDeviceStatusPayload {
  deviceId: string;
  ip?: string;
  rssi?: number;
  relay?: 'ON' | 'OFF';
  door?: DoorStatus;
  storedFingerprints?: number;
  uptimeSeconds?: number;
  heap?: number;
  timestamp?: string;
}

export interface WSAlarmTriggeredPayload {
  deviceId: string;
  roomId?: string;
  roomName?: string;
  duration?: number;
  timestamp?: string;
}

export interface WSAlarmClearedPayload {
  roomId: string;
  clearedBy?: string;
  timestamp?: string;
}

type EventCallback<T = any> = (payload: T) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<WSEventType | '*', Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private reconnectInterval = 2000;
  private isExplicitlyClosed = false;
  private isConnected = false;
  private pingInterval: number | null = null;
  private statusListeners: Set<(connected: boolean) => void> = new Set();

  constructor() {
    this.initListeners();
  }

  private initListeners() {
    const eventTypes: (WSEventType | '*')[] = [
      'ROOM_UPDATED',
      'LOG_CREATED',
      'USER_UPDATED',
      'ALARM_TRIGGERED',
      'ALARM_CLEARED',
      'ENROLL_STATUS',
      'DEVICE_STATUS',
      'HEARTBEAT',
      '*',
    ];
    eventTypes.forEach((t) => this.listeners.set(t, new Set()));
  }

  public getWsUrl(): string {
    const httpUrl = API_BASE_URL;
    const wsProto = httpUrl.startsWith('https') ? 'wss' : 'ws';
    const host = httpUrl.replace(/^https?:\/\//, '');
    return `${wsProto}://${host}/ws`;
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    const wsUrl = this.getWsUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyStatus(true);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const wsEvent: WSEvent = JSON.parse(event.data);
          this.dispatchEvent(wsEvent);
        } catch {
          // ignore non-json messages
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.notifyStatus(false);
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public onStatusChange(callback: (connected: boolean) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => {
      try {
        cb(connected);
      } catch {
        // ignore
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(1.3, this.reconnectAttempts - 1), 15000);
    setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'PING', timestamp: new Date().toISOString() }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private dispatchEvent(event: WSEvent) {
    // Specific event listeners
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event.payload);
        } catch {
          // handler error
        }
      });
    }

    // Wildcard listeners
    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch {
          // handler error
        }
      });
    }
  }

  public on<T = any>(event: WSEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(callback);
    return () => handlers.delete(callback);
  }

  public onAll(callback: EventCallback<WSEvent>): () => void {
    const handlers = this.listeners.get('*')!;
    handlers.add(callback);
    return () => handlers.delete(callback);
  }

  public onRoomUpdated(callback: (room: Room) => void): () => void {
    return this.on<Room>('ROOM_UPDATED', callback);
  }

  public onLogCreated(callback: (log: AccessLog) => void): () => void {
    return this.on<AccessLog>('LOG_CREATED', callback);
  }

  public onUserUpdated(callback: (user: User | any) => void): () => void {
    return this.on<User | any>('USER_UPDATED', callback);
  }

  public onAlarmTriggered(callback: (payload: WSAlarmTriggeredPayload) => void): () => void {
    return this.on<WSAlarmTriggeredPayload>('ALARM_TRIGGERED', callback);
  }

  public onAlarmCleared(callback: (payload: WSAlarmClearedPayload) => void): () => void {
    return this.on<WSAlarmClearedPayload>('ALARM_CLEARED', callback);
  }

  public onEnrollStatus(callback: (payload: WSEnrollStatusPayload) => void): () => void {
    return this.on<WSEnrollStatusPayload>('ENROLL_STATUS', callback);
  }

  public onDeviceStatus(callback: (payload: WSDeviceStatusPayload) => void): () => void {
    return this.on<WSDeviceStatusPayload>('DEVICE_STATUS', callback);
  }
}

export const wsService = new WebSocketService();
