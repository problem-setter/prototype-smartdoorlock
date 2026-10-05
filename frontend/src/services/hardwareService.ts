import mqtt, { MqttClient } from 'mqtt';

export interface BiometricAccessPayload {
  deviceId: string;
  activityType: 'FINGERPRINT_AUTH';
  authResult: 'SUCCESS' | 'FAILED';
  fingerprintTemplateId?: number;
  confidence?: number;
  durationMs?: number;
  details?: string;
  timestamp?: string;
}

export interface DoorStatusPayload {
  deviceId: string;
  doorStatus: 'OPEN' | 'CLOSED';
  isDoorOpen: boolean;
  timestamp?: string;
}

export interface AlarmStatusPayload {
  deviceId: string;
  alarm: 'TRIGGERED' | 'CLEARED';
  duration?: number;
  timestamp?: string;
}

export interface DeviceStatusPayload {
  deviceId: string;
  ip?: string;
  rssi?: number;
  relay?: 'ON' | 'OFF';
  door?: 'OPEN' | 'CLOSED';
  storedFingerprints?: number;
  uptimeSeconds?: number;
  heap?: number;
  enrollResult?: string;
  templateId?: number;
  userId?: string;
  timestamp?: string;
}

export interface EnrollStatusPayload {
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

export interface ConnectionState {
  mqttConnected: boolean;
  mqttConnecting: boolean;
  mqttBroker: string;
  serialConnected: boolean;
  serialPortName?: string;
  serialBaudRate: number;
  lastError?: string;
}

export type BiometricAccessListener = (data: BiometricAccessPayload) => void;
export type DoorStatusListener = (data: DoorStatusPayload) => void;
export type AlarmStatusListener = (data: AlarmStatusPayload) => void;
export type DeviceStatusListener = (data: DeviceStatusPayload) => void;
export type EnrollStatusListener = (data: EnrollStatusPayload) => void;
export type RawMessageListener = (topic: string, payload: Record<string, unknown>, direction: 'INCOMING' | 'OUTGOING') => void;
export type ConnectionStateListener = (state: ConnectionState) => void;

class HardwareService {
  private mqttClient: MqttClient | null = null;
  private defaultBrokerUrl = 'wss://broker.emqx.io:8084/mqtt';
  private currentBrokerUrl = 'wss://broker.emqx.io:8084/mqtt';

  // Web Serial
  private serialPort: unknown | null = null;
  private serialReader: ReadableStreamDefaultReader<string> | null = null;
  private serialWriter: WritableStreamDefaultWriter<string> | null = null;
  private serialReadAbortController: AbortController | null = null;
  private serialBaudRate = 115200;

  // Listeners
  private accessListeners: Set<BiometricAccessListener> = new Set();
  private doorListeners: Set<DoorStatusListener> = new Set();
  private alarmListeners: Set<AlarmStatusListener> = new Set();
  private statusListeners: Set<DeviceStatusListener> = new Set();
  private enrollListeners: Set<EnrollStatusListener> = new Set();
  private rawMessageListeners: Set<RawMessageListener> = new Set();
  private connectionListeners: Set<ConnectionStateListener> = new Set();

  private state: ConnectionState = {
    mqttConnected: false,
    mqttConnecting: false,
    mqttBroker: 'wss://broker.emqx.io:8084/mqtt',
    serialConnected: false,
    serialBaudRate: 115200,
  };

  constructor() {
    this.currentBrokerUrl = this.defaultBrokerUrl;
  }

  public getState(): ConnectionState {
    return { ...this.state };
  }

  private notifyConnectionState(partial: Partial<ConnectionState>) {
    this.state = { ...this.state, ...partial };
    this.connectionListeners.forEach((cb) => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('Error in connection state listener:', err);
      }
    });
  }

  // ==========================================
  // MQTT WEBSOCKET CONNECTION
  // ==========================================
  public connectMqtt(brokerUrl: string = this.defaultBrokerUrl) {
    if (this.mqttClient) {
      if (this.currentBrokerUrl === brokerUrl && (this.state.mqttConnected || this.state.mqttConnecting)) {
        return;
      }
      this.disconnectMqtt();
    }

    this.currentBrokerUrl = brokerUrl;
    this.notifyConnectionState({
      mqttConnecting: true,
      mqttBroker: brokerUrl,
      lastError: undefined,
    });

    try {
      const clientId = `smartdoorlock_web_${Math.random().toString(16).substring(2, 8)}`;
      const client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 4000,
      });

      this.mqttClient = client;

      client.on('connect', () => {
        this.notifyConnectionState({
          mqttConnected: true,
          mqttConnecting: false,
        });

        // Subscribe to all doorlock topics
        client.subscribe('doorlock/#', { qos: 1 }, (err) => {
          if (err) {
            console.error('Failed to subscribe to doorlock/#', err);
          } else {
            this.notifyRawMessage('smartlock/system', { status: 'SUBSCRIBED', topic: 'doorlock/#' }, 'INCOMING');
          }
        });
      });

      client.on('message', (topic, messageBuffer) => {
        try {
          const rawStr = messageBuffer.toString();
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(rawStr);
          } catch {
            parsed = { raw: rawStr };
          }

          this.handleIncomingMqttMessage(topic, parsed);
        } catch (err) {
          console.error('Error processing MQTT message:', err);
        }
      });

      client.on('error', (err) => {
        console.error('MQTT error:', err);
        this.notifyConnectionState({
          mqttConnected: false,
          mqttConnecting: false,
          lastError: err.message || 'MQTT Connection Error',
        });
      });

      client.on('offline', () => {
        this.notifyConnectionState({
          mqttConnected: false,
          mqttConnecting: false,
        });
      });

      client.on('close', () => {
        this.notifyConnectionState({
          mqttConnected: false,
          mqttConnecting: false,
        });
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.notifyConnectionState({
        mqttConnected: false,
        mqttConnecting: false,
        lastError: errorMsg,
      });
    }
  }

  public disconnectMqtt() {
    if (this.mqttClient) {
      try {
        this.mqttClient.end(true);
      } catch (err) {
        console.error('Error ending MQTT client:', err);
      }
      this.mqttClient = null;
    }
    this.notifyConnectionState({
      mqttConnected: false,
      mqttConnecting: false,
    });
  }

  public publishMqtt(topic: string, payload: Record<string, unknown>, qos: 0 | 1 = 1): boolean {
    if (!this.mqttClient || !this.state.mqttConnected) {
      this.notifyRawMessage(topic, payload, 'OUTGOING');
      return false;
    }

    try {
      const payloadStr = JSON.stringify(payload);
      this.mqttClient.publish(topic, payloadStr, { qos }, (err) => {
        if (err) {
          console.error('MQTT publish error:', err);
        }
      });
      this.notifyRawMessage(topic, payload, 'OUTGOING');
      return true;
    } catch (err) {
      console.error('Failed to publish MQTT message:', err);
      return false;
    }
  }

  // ==========================================
  // WEB SERIAL USB CONNECTION
  // ==========================================
  public isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async connectSerial(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSerialSupported()) {
      this.notifyConnectionState({ lastError: 'Web Serial API tidak didukung di browser ini. Gunakan Chrome, Edge, atau browser berbasis Chromium.' });
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navSerial = (navigator as any).serial;
      const port = await navSerial.requestPort();
      await port.open({ baudRate });

      this.serialPort = port;
      this.serialBaudRate = baudRate;
      this.serialReadAbortController = new AbortController();

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable, { signal: this.serialReadAbortController.signal });
      this.serialReader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(port.writable);
      this.serialWriter = textEncoder.writable.getWriter();

      this.notifyConnectionState({
        serialConnected: true,
        serialBaudRate: baudRate,
        serialPortName: 'ESP32 USB Serial',
        lastError: undefined,
      });

      this.startSerialReadLoop();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.notifyConnectionState({
        serialConnected: false,
        lastError: msg,
      });
      return false;
    }
  }

  private async startSerialReadLoop() {
    if (!this.serialReader) return;

    let buffer = '';
    try {
      while (true) {
        const { value, done } = await this.serialReader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.length > 0) {
              this.handleIncomingSerialLine(cleanLine);
            }
          }
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Serial read loop error:', err);
      }
    } finally {
      this.disconnectSerial();
    }
  }

  public async sendSerialCommand(cmd: string | Record<string, unknown>): Promise<boolean> {
    if (!this.serialWriter || !this.state.serialConnected) {
      return false;
    }

    try {
      const textToSend = (typeof cmd === 'object' ? JSON.stringify(cmd) : cmd) + '\n';
      await this.serialWriter.write(textToSend);
      this.notifyRawMessage('serial/tx', typeof cmd === 'object' ? cmd : { raw: cmd }, 'OUTGOING');
      return true;
    } catch (err) {
      console.error('Serial write error:', err);
      return false;
    }
  }

  public async disconnectSerial() {
    try {
      if (this.serialReadAbortController) {
        this.serialReadAbortController.abort();
        this.serialReadAbortController = null;
      }
      if (this.serialReader) {
        await this.serialReader.cancel().catch(() => {});
        this.serialReader = null;
      }
      if (this.serialWriter) {
        await this.serialWriter.close().catch(() => {});
        this.serialWriter = null;
      }
      if (this.serialPort) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this.serialPort as any).close().catch(() => {});
        this.serialPort = null;
      }
    } catch (err) {
      console.error('Error closing serial port:', err);
    }

    this.notifyConnectionState({
      serialConnected: false,
      serialPortName: undefined,
    });
  }

  // ==========================================
  // INCOMING MESSAGE DISPATCHER
  // ==========================================
  private handleIncomingMqttMessage(topic: string, payload: Record<string, unknown>) {
    this.notifyRawMessage(topic, payload, 'INCOMING');

    // Categorize by topic suffix
    if (topic.endsWith('/access')) {
      this.accessListeners.forEach((cb) => {
        try {
          cb(payload as unknown as BiometricAccessPayload);
        } catch (err) {
          console.error('Error in access listener:', err);
        }
      });
    } else if (topic.endsWith('/door')) {
      this.doorListeners.forEach((cb) => {
        try {
          cb(payload as unknown as DoorStatusPayload);
        } catch (err) {
          console.error('Error in door listener:', err);
        }
      });
    } else if (topic.endsWith('/alarm')) {
      this.alarmListeners.forEach((cb) => {
        try {
          cb(payload as unknown as AlarmStatusPayload);
        } catch (err) {
          console.error('Error in alarm listener:', err);
        }
      });
    } else if (topic.endsWith('/status')) {
      this.statusListeners.forEach((cb) => {
        try {
          cb(payload as unknown as DeviceStatusPayload);
        } catch (err) {
          console.error('Error in status listener:', err);
        }
      });
    } else if (topic.endsWith('/enroll/status')) {
      this.enrollListeners.forEach((cb) => {
        try {
          cb(payload as unknown as EnrollStatusPayload);
        } catch (err) {
          console.error('Error in enroll listener:', err);
        }
      });
    }
  }

  private handleIncomingSerialLine(line: string) {
    // Check if line is formatted as JSON or prefixed with [JSON]
    let jsonStr = line;
    if (line.startsWith('[JSON]')) {
      jsonStr = line.substring(6).trim();
    }

    try {
      if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
        const parsed = JSON.parse(jsonStr);
        const eventType = parsed.event || parsed.activityType;

        if (eventType === 'ACCESS' || eventType === 'FINGERPRINT_AUTH' || parsed.authResult) {
          this.handleIncomingMqttMessage(`doorlock/${parsed.deviceId || 'ESP32-USB'}/access`, parsed);
        } else if (eventType === 'DOOR' || parsed.doorStatus !== undefined) {
          this.handleIncomingMqttMessage(`doorlock/${parsed.deviceId || 'ESP32-USB'}/door`, parsed);
        } else if (eventType === 'ALARM' || parsed.alarm !== undefined) {
          this.handleIncomingMqttMessage(`doorlock/${parsed.deviceId || 'ESP32-USB'}/alarm`, parsed);
        } else if (eventType === 'STATUS' || parsed.storedFingerprints !== undefined) {
          this.handleIncomingMqttMessage(`doorlock/${parsed.deviceId || 'ESP32-USB'}/status`, parsed);
        } else if (eventType === 'ENROLL' || parsed.step !== undefined) {
          this.handleIncomingMqttMessage(`doorlock/${parsed.deviceId || 'ESP32-USB'}/enroll/status`, parsed);
        } else {
          this.notifyRawMessage('serial/rx', parsed, 'INCOMING');
        }
        return;
      }
    } catch {
      // Non-JSON plain text serial line
    }

    this.notifyRawMessage('serial/rx', { text: line }, 'INCOMING');
  }

  private notifyRawMessage(topic: string, payload: Record<string, unknown>, direction: 'INCOMING' | 'OUTGOING') {
    this.rawMessageListeners.forEach((cb) => {
      try {
        cb(topic, payload, direction);
      } catch (err) {
        console.error('Error in raw message listener:', err);
      }
    });
  }

  // ==========================================
  // HIGH-LEVEL HARDWARE ACTIONS
  // ==========================================
  public unlockDoor(deviceId: string, durationSec: number = 5, user?: string) {
    const payload = { action: 'UNLOCK', duration: durationSec, user: user || 'Web Dashboard' };
    this.publishMqtt(`doorlock/${deviceId}/cmd/unlock`, payload);
    if (this.state.serialConnected) {
      this.sendSerialCommand({ cmd: 'unlock', duration: durationSec });
    }
  }

  public forceLock(deviceId: string, user?: string) {
    const payload = { action: 'FORCE_LOCK', user: user || 'Web Dashboard' };
    this.publishMqtt(`doorlock/${deviceId}/cmd/lock`, payload);
    if (this.state.serialConnected) {
      this.sendSerialCommand({ cmd: 'lock' });
    }
  }

  public clearAlarm(deviceId: string) {
    const payload = { cmd: 'clear_alarm', action: 'CLEAR_ALARM' };
    this.publishMqtt(`doorlock/${deviceId}/cmd/clear_alarm`, payload);
    if (this.state.serialConnected) {
      this.sendSerialCommand({ cmd: 'clear_alarm' });
    }
  }

  public startEnroll(deviceId: string, templateId: number, userId?: string) {
    const payload = { cmd: 'enroll', id: templateId, action: 'START_ENROLL', targetTemplateId: templateId, userId };
    this.publishMqtt(`doorlock/${deviceId}/cmd/enroll`, payload);
    if (this.state.serialConnected) {
      this.sendSerialCommand({ cmd: 'enroll', id: templateId });
    }
  }

  public cancelEnroll(deviceId: string) {
    const payload = { cmd: 'cancel_enroll', action: 'CANCEL_ENROLL' };
    this.publishMqtt(`doorlock/${deviceId}/cmd/enroll`, payload);
    if (this.state.serialConnected) {
      this.sendSerialCommand({ cmd: 'cancel_enroll' });
    }
  }

  public deleteFingerprint(deviceId: string, templateId: number) {
    const payload = { cmd: 'delete', id: templateId, action: 'DELETE', targetTemplateId: templateId };
    this.publishMqtt(`doorlock/${deviceId}/cmd/delete`, payload);
    if (this.state.serialConnected) {
      this.sendSerialCommand({ cmd: 'delete', id: templateId });
    }
  }

  // ==========================================
  // SUBSCRIPTION REGISTRATION
  // ==========================================
  public onAccess(listener: BiometricAccessListener): () => void {
    this.accessListeners.add(listener);
    return () => this.accessListeners.delete(listener);
  }

  public onDoor(listener: DoorStatusListener): () => void {
    this.doorListeners.add(listener);
    return () => this.doorListeners.delete(listener);
  }

  public onAlarm(listener: AlarmStatusListener): () => void {
    this.alarmListeners.add(listener);
    return () => this.alarmListeners.delete(listener);
  }

  public onStatus(listener: DeviceStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  public onEnrollStatus(listener: EnrollStatusListener): () => void {
    this.enrollListeners.add(listener);
    return () => this.enrollListeners.delete(listener);
  }

  public onRawMessage(listener: RawMessageListener): () => void {
    this.rawMessageListeners.add(listener);
    return () => this.rawMessageListeners.delete(listener);
  }

  public onConnectionState(listener: ConnectionStateListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.state);
    return () => this.connectionListeners.delete(listener);
  }
}

export const hardwareService = new HardwareService();
