import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  User,
  Room,
  AccessLog,
  MQTTMessage,
  RegistrationPayload,
  ApprovalPayload,
  UserStatus,
  getUserAccessValidity
} from '../types';
import { INITIAL_USERS, INITIAL_ROOMS, INITIAL_LOGS } from '../mock/initialData';
import { AppContext } from './AppContextBase';
import { hardwareService, ConnectionState } from '../services/hardwareService';
import { api, getStoredToken, clearStoredToken } from '../services/api';
import { wsService } from '../services/websocketService';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [logs, setLogs] = useState<AccessLog[]>(INITIAL_LOGS);
  const [mqttMessages, setMqttMessages] = useState<MQTTMessage[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(hardwareService.getState());

  const relockTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const usersRef = useRef<User[]>(users);
  const roomsRef = useRef<Room[]>(rooms);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Cleanup relock timers on unmount
  useEffect(() => {
    const timers = relockTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const appendLog = useCallback((log: Omit<AccessLog, 'id' | 'eventId' | 'timestamp'>) => {
    const newLog: AccessLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      eventId: `EVT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev]);
  }, []);

  const appendMQTT = useCallback((topic: string, payload: Record<string, unknown>, direction: 'INCOMING' | 'OUTGOING' = 'INCOMING') => {
    const msg: MQTTMessage = {
      id: `mqtt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      topic,
      payload,
      qos: 1,
      timestamp: new Date().toISOString(),
      direction,
    };
    setMqttMessages((prev) => [msg, ...prev.slice(0, 49)]);
  }, []);

  // =========================================================================
  // 1. INITIAL BACKEND DATA HYDRATION (REST API & AUTH CHECK)
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    async function hydrateFromBackend() {
      // 1. Check stored JWT token
      const token = getStoredToken();
      if (token) {
        try {
          const meRes = await api.getMe();
          if (isMounted && meRes.user) {
            setCurrentUser(meRes.user);
          }
        } catch {
          // invalid token
          clearStoredToken();
        }
      }

      // 2. Fetch Rooms
      try {
        const fetchedRooms = await api.getRooms();
        if (isMounted && Array.isArray(fetchedRooms)) {
          setRooms(fetchedRooms);
        }
      } catch {
        // use fallback initial rooms
      }

      // 3. Fetch Users
      try {
        const fetchedUsers = await api.getUsers();
        if (isMounted && Array.isArray(fetchedUsers)) {
          setUsers(fetchedUsers);
        }
      } catch {
        // use fallback initial users
      }

      // 4. Fetch Logs
      try {
        const logRes = await api.getLogs({ limit: 50 });
        if (isMounted && logRes && Array.isArray(logRes.logs)) {
          setLogs(logRes.logs);
        }
      } catch {
        // use fallback initial logs
      }
    }

    hydrateFromBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================================
  // 2. GORILLA WEBSOCKET REAL-TIME SUBSCRIPTIONS
  // =========================================================================
  useEffect(() => {
    wsService.connect();

    const unsubRoom = wsService.onRoomUpdated((updatedRoom) => {
      setRooms((prev) =>
        prev.map((r) => (r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r))
      );
    });

    const unsubLog = wsService.onLogCreated((newLog) => {
      setLogs((prev) => {
        if (prev.some((l) => l.eventId === newLog.eventId)) {
          return prev;
        }
        return [newLog, ...prev];
      });
    });

    const unsubUser = wsService.onUserUpdated((updatedUser) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      );
      setCurrentUser((prev) => (prev && prev.id === updatedUser.id ? { ...prev, ...updatedUser } : prev));
    });

    const unsubAlarm = wsService.onAlarmTriggered((payload) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.deviceId === payload.deviceId || r.id === payload.roomId
            ? { ...r, isAlarmActive: true }
            : r
        )
      );
    });

    const unsubAlarmClear = wsService.onAlarmCleared((payload) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === payload.roomId || r.deviceId === payload.roomId
            ? { ...r, isAlarmActive: false, openDurationSeconds: 0 }
            : r
        )
      );
    });

    const unsubDevice = wsService.onDeviceStatus((payload) => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.deviceId === payload.deviceId) {
            return {
              ...r,
              deviceStatus: 'ONLINE',
              relayStatus: payload.relay || r.relayStatus,
              doorStatus: payload.door || r.doorStatus,
              usedFingerprints: payload.storedFingerprints !== undefined ? payload.storedFingerprints : r.usedFingerprints,
            };
          }
          return r;
        })
      );
    });

    const unsubEnroll = wsService.onEnrollStatus((payload) => {
      if (payload.status === 'STORE_OK') {
        setRooms((prev) =>
          prev.map((r) =>
            r.deviceId === payload.deviceId ? { ...r, usedFingerprints: r.usedFingerprints + 1 } : r
          )
        );
      }
    });

    return () => {
      unsubRoom();
      unsubLog();
      unsubUser();
      unsubAlarm();
      unsubAlarmClear();
      unsubDevice();
      unsubEnroll();
      wsService.disconnect();
    };
  }, []);

  // =========================================================================
  // 3. HARDWARE SERVICE TELEMETRY & MQTT SUBSCRIPTIONS
  // =========================================================================
  useEffect(() => {
    const unsubConn = hardwareService.onConnectionState((state) => {
      setConnectionState(state);
    });

    const unsubRaw = hardwareService.onRawMessage((topic, payload, direction) => {
      appendMQTT(topic, payload, direction);
    });

    const unsubAccess = hardwareService.onAccess((payload) => {
      const targetRoom = roomsRef.current.find((r) => r.deviceId === payload.deviceId) || roomsRef.current[0];
      if (!targetRoom) return;

      let matchedUser: User | undefined;
      let matchedLabel: string | undefined;

      if (payload.fingerprintTemplateId !== undefined) {
        const templateId = payload.fingerprintTemplateId;
        matchedUser = usersRef.current.find((u) => {
          if (u.fingerprints && u.fingerprints.some((f) => f.templateId === templateId)) {
            matchedLabel = u.fingerprints.find((f) => f.templateId === templateId)?.label;
            return true;
          }
          if (u.fingerprintTemplateIds && u.fingerprintTemplateIds.includes(templateId)) {
            return true;
          }
          return u.fingerprintTemplateId === templateId;
        });
      }

      if (payload.authResult === 'SUCCESS') {
        if (relockTimersRef.current.has(targetRoom.id)) {
          clearTimeout(relockTimersRef.current.get(targetRoom.id)!);
          relockTimersRef.current.delete(targetRoom.id);
        }

        setRooms((prev) =>
          prev.map((r) =>
            r.id === targetRoom.id
              ? {
                  ...r,
                  lockStatus: 'UNLOCKED',
                  relayStatus: 'ON',
                }
              : r
          )
        );

        const timer = setTimeout(() => {
          setRooms((prev) =>
            prev.map((r) =>
              r.id === targetRoom.id ? { ...r, lockStatus: 'LOCKED', relayStatus: 'OFF' } : r
            )
          );
          relockTimersRef.current.delete(targetRoom.id);
        }, 5000);
        relockTimersRef.current.set(targetRoom.id, timer);

        appendLog({
          deviceId: targetRoom.deviceId,
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          userId: matchedUser?.id,
          userName: matchedUser?.name || 'Tamu Terdaftar',
          userRole: matchedUser?.role || 'user',
          fingerprintTemplateId: payload.fingerprintTemplateId,
          activityType: 'FINGERPRINT_AUTH',
          authResult: 'SUCCESS',
          details:
            payload.details ||
            `Autentikasi Sidik Jari DY50 Berhasil (ID #${payload.fingerprintTemplateId}${
              matchedLabel ? ` - ${matchedLabel}` : ''
            }, Confidence: ${payload.confidence || 85}%). Kunci solenoid terbuka 5 detik.`,
          doorStatusAtEvent: targetRoom.doorStatus,
        });
      } else {
        appendLog({
          deviceId: targetRoom.deviceId,
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          activityType: 'FINGERPRINT_AUTH',
          authResult: 'FAILED',
          details:
            payload.details ||
            'Autentikasi Sidik Jari Gagal: Pola biometrik tidak cocok atau jari tidak terdaftar pada modul DY50.',
          doorStatusAtEvent: targetRoom.doorStatus,
        });
      }
    });

    const unsubDoor = hardwareService.onDoor((payload) => {
      const isDoorOpen = payload.doorStatus === 'OPEN' || payload.isDoorOpen;
      setRooms((prev) =>
        prev.map((r) =>
          r.deviceId === payload.deviceId || (!prev.some((p) => p.deviceId === payload.deviceId) && r.id === prev[0]?.id)
            ? { ...r, doorStatus: isDoorOpen ? 'OPEN' : 'CLOSED' }
            : r
        )
      );
    });

    const unsubAlarm = hardwareService.onAlarm((payload) => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.deviceId === payload.deviceId || (!prev.some((p) => p.deviceId === payload.deviceId) && r.id === prev[0]?.id)) {
            const isTriggered = payload.alarm === 'TRIGGERED';
            return {
              ...r,
              isAlarmActive: isTriggered,
            };
          }
          return r;
        })
      );
    });

    const unsubStatus = hardwareService.onStatus((payload) => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.deviceId === payload.deviceId) {
            return {
              ...r,
              deviceStatus: 'ONLINE',
              relayStatus: payload.relay || r.relayStatus,
              doorStatus: payload.door || r.doorStatus,
              usedFingerprints: payload.storedFingerprints !== undefined ? payload.storedFingerprints : r.usedFingerprints,
            };
          }
          return r;
        })
      );
    });

    const unsubEnroll = hardwareService.onEnrollStatus((payload) => {
      if (payload.status === 'STORE_OK') {
        setRooms((prev) =>
          prev.map((r) => {
            if (r.deviceId === payload.deviceId) {
              return {
                ...r,
                usedFingerprints: r.usedFingerprints + 1,
              };
            }
            return r;
          })
        );
      }
    });

    // Auto-connect MQTT on load
    hardwareService.connectMqtt();

    return () => {
      unsubConn();
      unsubRaw();
      unsubAccess();
      unsubDoor();
      unsubAlarm();
      unsubStatus();
      unsubEnroll();
    };
  }, [appendLog, appendMQTT]);

  const clearMqttLogs = useCallback(() => {
    setMqttMessages([]);
  }, []);

  const connectMqtt = useCallback((brokerUrl?: string) => {
    hardwareService.connectMqtt(brokerUrl);
  }, []);

  const disconnectMqtt = useCallback(() => {
    hardwareService.disconnectMqtt();
  }, []);

  const connectSerial = useCallback(async (baudRate?: number) => {
    return await hardwareService.connectSerial(baudRate);
  }, []);

  const disconnectSerial = useCallback(async () => {
    await hardwareService.disconnectSerial();
  }, []);

  const exportLogs = useCallback((format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `smartlock_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['Event ID', 'Waktu', 'Ruangan', 'Perangkat', 'Pengguna', 'Role', 'Aktivitas', 'Hasil', 'Detail'];
      const rows = logs.map((l) => [
        l.eventId,
        l.timestamp,
        `"${l.roomName}"`,
        l.deviceId,
        `"${l.userName || 'Sistem'}"`,
        l.userRole || '-',
        l.activityType,
        l.authResult,
        `"${l.details.replace(/"/g, '""')}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodeURI(csvContent));
      downloadAnchor.setAttribute('download', `smartlock_audit_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  }, [logs]);

  const login = useCallback((user: User): { success: boolean; message?: string } => {
    const validity = getUserAccessValidity(user);

    if (user.status === 'PENDING_APPROVAL') {
      return {
        success: false,
        message: 'Permohonan pendaftaran Anda sedang dalam antrean peninjauan oleh Superadmin. Silakan cek status secara berkala.',
      };
    }

    if (user.status === 'REJECTED') {
      return {
        success: false,
        message: 'Permohonan pendaftaran Anda telah ditolak oleh administrator.',
      };
    }

    if (user.status === 'SUSPENDED') {
      return {
        success: false,
        message: 'Akun Anda telah dinonaktifkan sementara oleh administrator.',
      };
    }

    if (validity.isExpired || user.status === 'EXPIRED') {
      return {
        success: false,
        message: `Masa berlaku akses Anda telah berakhir (${user.validUntil ? new Date(user.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Kedaluwarsa'}). Silakan hubungi Superadmin untuk perpanjangan izin.`,
      };
    }

    setCurrentUser(user);
    setSelectedRoomId(null);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setCurrentUser(null);
    setSelectedRoomId(null);
  }, []);

  const triggerRemoteUnlock = useCallback(async (roomId: string): Promise<boolean> => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom || targetRoom.deviceStatus === 'OFFLINE' || !currentUser) return false;

    const validity = getUserAccessValidity(currentUser);
    if (!validity.isValid || validity.isExpired) {
      appendLog({
        deviceId: targetRoom.deviceId,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        activityType: 'REMOTE_UNLOCK',
        authResult: 'DENIED',
        details: `Akses ditolak: Masa berlaku akun ${currentUser.name} telah kedaluwarsa (${validity.statusText}).`,
        doorStatusAtEvent: targetRoom.doorStatus,
      });
      return false;
    }

    if (currentUser.role !== 'superadmin' && !currentUser.accessibleRoomIds.includes(roomId)) {
      appendLog({
        deviceId: targetRoom.deviceId,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        activityType: 'REMOTE_UNLOCK',
        authResult: 'DENIED',
        details: `Akses ditolak: Pengguna ${currentUser.name} tidak memiliki hak akses ruangan ${targetRoom.name}.`,
        doorStatusAtEvent: targetRoom.doorStatus,
      });
      return false;
    }

    if (relockTimersRef.current.has(roomId)) {
      clearTimeout(relockTimersRef.current.get(roomId)!);
      relockTimersRef.current.delete(roomId);
    }

    // Call real backend API
    try {
      await api.remoteUnlock(roomId, `Remote Unlock oleh ${currentUser.name} (${currentUser.role})`);
    } catch {
      // Hardware service fallback if REST fails
      hardwareService.unlockDoor(targetRoom.deviceId, 5, currentUser.name);
    }

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, lockStatus: 'UNLOCKED', relayStatus: 'ON' }
          : r
      )
    );

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userRole: currentUser?.role,
      activityType: 'REMOTE_UNLOCK',
      authResult: 'SUCCESS',
      details: `Remote Unlock dieksekusi oleh ${currentUser?.name} (${currentUser?.role || 'user'}). Relay 12V aktif 5s.`,
      doorStatusAtEvent: targetRoom.doorStatus,
    });

    const timer = setTimeout(() => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId ? { ...r, lockStatus: 'LOCKED', relayStatus: 'OFF' } : r
        )
      );
      relockTimersRef.current.delete(roomId);
    }, 5000);
    relockTimersRef.current.set(roomId, timer);

    return true;
  }, [rooms, currentUser, appendLog]);

  const forceRelock = useCallback(async (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    if (relockTimersRef.current.has(roomId)) {
      clearTimeout(relockTimersRef.current.get(roomId)!);
      relockTimersRef.current.delete(roomId);
    }

    // Call real backend API
    try {
      await api.forceLock(roomId);
    } catch {
      hardwareService.forceLock(targetRoom.deviceId, currentUser?.name);
    }

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, lockStatus: 'LOCKED', relayStatus: 'OFF' } : r
      )
    );

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userRole: currentUser?.role,
      activityType: 'REMOTE_UNLOCK',
      authResult: 'SUCCESS',
      details: `Kunci solenoid dihentikan paksa (Force Relock) seketika oleh ${currentUser?.name} (${currentUser?.role}). Relay dinonaktifkan.`,
      doorStatusAtEvent: targetRoom.doorStatus,
    });
  }, [rooms, currentUser, appendLog]);

  const requestRoomAccess = useCallback(async (roomId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom || !currentUser) return { success: false, message: 'Ruangan atau user tidak valid.' };

    try {
      const res = await api.requestAccess(roomId, reason);
      return res;
    } catch {
      // Local fallback
      appendLog({
        deviceId: targetRoom.deviceId,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        activityType: 'FINGERPRINT_AUTH',
        authResult: 'DENIED',
        details: `[PERMOHONAN AKSES] ${currentUser.name} (${currentUser.email}) mengajukan izin akses ruangan ${targetRoom.name}. Alasan: "${reason}". Menunggu persetujuan Superadmin.`,
        doorStatusAtEvent: targetRoom.doorStatus,
      });

      appendMQTT(`smartlock/requests/access`, {
        userId: currentUser.id,
        userName: currentUser.name,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        reason,
        timestamp: new Date().toISOString(),
      }, 'OUTGOING');

      return { success: true, message: 'Permohonan izin akses berhasil diajukan ke Superadmin.' };
    }
  }, [rooms, currentUser, appendLog, appendMQTT]);

  const clearAlarm = useCallback(async (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    if (currentUser?.role !== 'superadmin' && !currentUser?.accessibleRoomIds.includes(roomId)) {
      return;
    }

    try {
      await api.clearAlarm(roomId);
    } catch {
      hardwareService.clearAlarm(targetRoom.deviceId);
    }

    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, isAlarmActive: false, openDurationSeconds: 0 } : r))
    );

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      activityType: 'ALARM_CLEARED',
      authResult: 'SYSTEM',
      details: 'Alarm door open timeout dinonaktifkan oleh administrator.',
      doorStatusAtEvent: targetRoom.doorStatus,
    });
  }, [rooms, currentUser, appendLog]);

  // Door timeout counter tick
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms((prevRooms) => {
        const hasOpenRoom = prevRooms.some((r) => r.doorStatus === 'OPEN');
        if (!hasOpenRoom) {
          return prevRooms;
        }

        return prevRooms.map((room) => {
          if (room.doorStatus === 'OPEN') {
            const nextSec = (room.openDurationSeconds || 0) + 1;
            const triggerAlarm = nextSec >= 15 && !room.isAlarmActive;

            if (triggerAlarm) {
              appendMQTT(`doorlock/${room.deviceId}/alarm`, { alarm: 'TRIGGERED', duration: nextSec });
              appendLog({
                deviceId: room.deviceId,
                roomId: room.id,
                roomName: room.name,
                activityType: 'ALARM_TRIGGERED',
                authResult: 'SYSTEM',
                details: `Pintu terbuka lebih dari batas waktu (15s)! Buzzer aktif.`,
                doorStatusAtEvent: 'OPEN',
              });
            }

            return {
              ...room,
              openDurationSeconds: nextSec,
              isAlarmActive: nextSec >= 15,
            };
          }
          return room;
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appendLog, appendMQTT]);

  const addUser = useCallback((userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    api.createUser({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      accessibleRoomIds: userData.accessibleRoomIds || [],
      validFrom: userData.validFrom,
      validUntil: userData.validUntil,
    }).catch(() => {});

    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  }, []);

  const registerUser = useCallback(async (payload: RegistrationPayload): Promise<{ success: boolean; message: string; user: User }> => {
    try {
      const res = await api.register(payload);
      if (res && res.user) {
        setUsers((prev) => [res.user, ...prev]);
        return {
          success: true,
          message: res.message || 'Permohonan pendaftaran akun Anda berhasil diajukan. Silakan tunggu verifikasi dari Administrator.',
          user: res.user,
        };
      }
    } catch {
      // Fallback
    }

    const now = new Date().toISOString();

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: 'user',
      status: 'PENDING_APPROVAL',
      accessibleRoomIds: [],
      requestedRoomIds: payload.requestedRoomIds || [],
      validFrom: payload.validFrom,
      validUntil: payload.validUntil,
      fingerprints: [],
      fingerprintTemplateIds: [],
      createdAt: now,
    };

    setUsers((prev) => [newUser, ...prev]);

    appendLog({
      deviceId: 'PORTAL-AUTH',
      roomId: 'room-auth',
      roomName: 'Portal Pendaftaran FT UNTAN',
      userId: newUser.id,
      userName: newUser.name,
      userRole: 'user',
      activityType: 'FINGERPRINT_AUTH',
      authResult: 'DENIED',
      details: `[PENDAFTARAN MANDIRI] ${newUser.name} (${newUser.email}) mengajukan permohonan akses (${(payload.requestedRoomIds || []).length} ruangan).`,
    });

    appendMQTT('doorlock/auth/register', {
      event: 'SELF_REGISTRATION_SUBMITTED',
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      requestedRooms: payload.requestedRoomIds,
      validFrom: payload.validFrom,
      validUntil: payload.validUntil,
      timestamp: now,
    }, 'OUTGOING');

    return {
      success: true,
      message: 'Permohonan pendaftaran akun Anda berhasil diajukan. Silakan tunggu verifikasi dari Administrator.',
      user: newUser,
    };
  }, [appendLog, appendMQTT]);

  const approveUserRegistration = useCallback(async (userId: string, payload: ApprovalPayload): Promise<{ success: boolean; message: string }> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Pengguna tidak ditemukan.' };

    try {
      const res = await api.approveUser(userId, payload);
      if (res && res.id) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? res : u)));
        return {
          success: true,
          message: `Akun "${targetUser.name}" berhasil disetujui.`,
        };
      }
    } catch {
      // Fallback
    }

    const now = new Date();
    const updatedUser: User = {
      ...targetUser,
      status: 'ACTIVE',
      accessibleRoomIds: payload.approvedRoomIds || [],
      validFrom: payload.validFrom || now.toISOString(),
      validUntil: payload.validUntil,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    appendLog({
      deviceId: 'PORTAL-ADMIN',
      roomId: 'room-auth',
      roomName: 'Manajemen Akses FT UNTAN',
      userId: targetUser.id,
      userName: targetUser.name,
      userRole: targetUser.role,
      activityType: 'ENROLLMENT_SUCCESS',
      authResult: 'SUCCESS',
      details: `[PERSETUJUAN PENDAFTARAN] Administrator (${currentUser?.name || 'Admin'}) menyetujui akun ${targetUser.name}. Masa aktif: ${payload.validUntil ? new Date(payload.validUntil).toLocaleString('id-ID') : 'Permanen'}. Akses ke ${(payload.approvedRoomIds || []).length} ruangan.`,
    });

    appendMQTT('doorlock/auth/approval', {
      event: 'REGISTRATION_APPROVED',
      userId: targetUser.id,
      name: targetUser.name,
      role: targetUser.role,
      accessibleRooms: payload.approvedRoomIds,
      validFrom: payload.validFrom,
      validUntil: payload.validUntil,
      timestamp: now.toISOString(),
    }, 'OUTGOING');

    return {
      success: true,
      message: `Akun "${targetUser.name}" berhasil disetujui.`,
    };
  }, [users, currentUser, appendLog, appendMQTT]);

  const rejectUserRegistration = useCallback(async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Pengguna tidak ditemukan.' };

    try {
      const res = await api.rejectUser(userId, reason);
      if (res && res.id) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? res : u)));
        return {
          success: true,
          message: `Permohonan pendaftaran "${targetUser.name}" telah ditolak.`,
        };
      }
    } catch {
      // Fallback
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'REJECTED',
            }
          : u
      )
    );

    appendLog({
      deviceId: 'PORTAL-ADMIN',
      roomId: 'room-auth',
      roomName: 'Manajemen Akses FT UNTAN',
      userId: targetUser.id,
      userName: targetUser.name,
      userRole: targetUser.role,
      activityType: 'ENROLLMENT_FAILED',
      authResult: 'DENIED',
      details: `[PENOLAKAN PENDAFTARAN] Administrator (${currentUser?.name || 'Admin'}) menolak permohonan akun ${targetUser.name}. Alasan: "${reason}".`,
    });

    appendMQTT('doorlock/auth/rejection', {
      event: 'REGISTRATION_REJECTED',
      userId: targetUser.id,
      name: targetUser.name,
      rejectedBy: currentUser?.name,
      reason,
      timestamp: new Date().toISOString(),
    }, 'OUTGOING');

    return {
      success: true,
      message: `Permohonan pendaftaran "${targetUser.name}" telah ditolak.`,
    };
  }, [users, currentUser, appendLog, appendMQTT]);

  const extendUserAccess = useCallback(async (userId: string, payload: ApprovalPayload): Promise<{ success: boolean; message: string }> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Pengguna tidak ditemukan.' };

    try {
      const res = await api.approveUser(userId, payload);
      if (res && res.id) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? res : u)));
        return {
          success: true,
          message: `Masa aktif akses "${targetUser.name}" berhasil diperpanjang.`,
        };
      }
    } catch {
      // Fallback
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'ACTIVE',
              validFrom: payload.validFrom || u.validFrom || new Date().toISOString(),
              validUntil: payload.validUntil,
              accessibleRoomIds: payload.approvedRoomIds || u.accessibleRoomIds,
            }
          : u
      )
    );

    appendLog({
      deviceId: 'PORTAL-ADMIN',
      roomId: 'room-auth',
      roomName: 'Manajemen Akses FT UNTAN',
      userId: targetUser.id,
      userName: targetUser.name,
      userRole: targetUser.role,
      activityType: 'ENROLLMENT_SUCCESS',
      authResult: 'SUCCESS',
      details: `[PERPANJANGAN AKSES] Administrator (${currentUser?.name || 'Admin'}) memperpanjang masa aktif akun ${targetUser.name}. Berlaku hingga: ${payload.validUntil ? new Date(payload.validUntil).toLocaleString('id-ID') : 'Permanen'}.`,
    });

    return {
      success: true,
      message: `Masa aktif akses "${targetUser.name}" berhasil diperpanjang.`,
    };
  }, [users, currentUser, appendLog]);

  const updateUser = useCallback((userId: string, updatedData: Partial<User>) => {
    api.updateUser(userId, updatedData).catch(() => {});

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, ...updatedData };
        }
        return u;
      })
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updatedData } : prev));
    }
  }, [currentUser]);

  const updateUserStatus = useCallback((userId: string, status: UserStatus) => {
    if (status === 'ACTIVE') {
      api.activateUser(userId).catch(() => {});
    } else if (status === 'SUSPENDED') {
      api.suspendUser(userId).catch(() => {});
    } else {
      api.updateUser(userId, { status }).catch(() => {});
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, status } : prev));
    }
  }, [currentUser]);

  const deleteUser = useCallback((userId: string) => {
    api.deleteUser(userId).catch(() => {});
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const enrollFingerprint = useCallback(async (
    userId: string,
    roomId: string,
    label?: string
  ): Promise<{ success: boolean; templateId: number; message?: string }> => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    const targetUser = users.find((u) => u.id === userId);
    if (!targetRoom || !targetUser) return { success: false, templateId: 0, message: 'User/ruangan tidak ditemukan' };

    const existingFps = targetUser.fingerprints || (
      targetUser.fingerprintTemplateIds
        ? targetUser.fingerprintTemplateIds.map((id, i) => ({
            templateId: id,
            label: i === 0 ? 'Jempol Kanan' : i === 1 ? 'Telunjuk Kanan' : 'Jempol Kiri',
            registeredAt: new Date().toISOString()
          }))
        : targetUser.fingerprintTemplateId
          ? [{ templateId: targetUser.fingerprintTemplateId, label: 'Jempol Kanan', registeredAt: new Date().toISOString() }]
          : []
    );

    if (existingFps.length >= 3) {
      return { success: false, templateId: 0, message: 'User sudah memiliki batas maksimal 3 fingerprint.' };
    }

    const existingIds = existingFps.map((f) => f.templateId);
    let newTemplateId = Math.floor(10 + Math.random() * 80);
    while (existingIds.includes(newTemplateId)) {
      newTemplateId = Math.floor(10 + Math.random() * 80);
    }

    const defaultLabels = ['Jempol Kanan', 'Telunjuk Kanan', 'Jempol Kiri'];
    const chosenLabel = label && label.trim() !== '' ? label.trim() : defaultLabels[existingFps.length] || `Fingerprint #${existingFps.length + 1}`;

    // 1. Trigger backend enrollment command & database slot
    try {
      await api.startEnrollment(targetRoom.deviceId, newTemplateId, userId);
      await api.addFingerprint(userId, { templateId: newTemplateId, label: chosenLabel });
    } catch {
      // Fallback to hardwareService
      hardwareService.startEnroll(targetRoom.deviceId, newTemplateId, userId);
    }

    const newSlot = {
      templateId: newTemplateId,
      label: chosenLabel,
      registeredAt: new Date().toISOString()
    };

    const updatedFps = [...existingFps, newSlot];
    const updatedIds = updatedFps.map((f) => f.templateId);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              fingerprintTemplateId: updatedIds[0],
              fingerprintTemplateIds: updatedIds,
              fingerprints: updatedFps,
            }
          : u
      )
    );

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, usedFingerprints: r.usedFingerprints + 1 } : r
      )
    );

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      userId: targetUser.id,
      userName: targetUser.name,
      fingerprintTemplateId: newTemplateId,
      activityType: 'ENROLLMENT_SUCCESS',
      authResult: 'SUCCESS',
      details: `Pendaftaran sidik jari "${chosenLabel}" (#${newTemplateId}) untuk ${targetUser.name} berhasil disimpan (Slot ${updatedFps.length}/3).`,
      doorStatusAtEvent: targetRoom.doorStatus,
    });

    return { success: true, templateId: newTemplateId };
  }, [rooms, users, appendLog]);

  const cancelEnrollFingerprint = useCallback((roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    api.cancelEnrollment(targetRoom.deviceId).catch(() => {});
    hardwareService.cancelEnroll(targetRoom.deviceId);
  }, [rooms]);

  const updateFingerprintLabel = useCallback((userId: string, templateId: number, newLabel: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const fps = u.fingerprints || [];
        const updatedFps = fps.map((f) => (f.templateId === templateId ? { ...f, label: newLabel } : f));
        return {
          ...u,
          fingerprints: updatedFps,
        };
      })
    );
  }, []);

  const removeFingerprint = useCallback((userId: string, templateId: number) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const targetRoom = rooms[0];

    // Call real backend API
    api.deleteFingerprint(userId, templateId).catch(() => {});

    if (targetRoom) {
      hardwareService.deleteFingerprint(targetRoom.deviceId, templateId);
    }

    const existingFps = targetUser.fingerprints || (
      targetUser.fingerprintTemplateIds
        ? targetUser.fingerprintTemplateIds.map((id, i) => ({
            templateId: id,
            label: `Slot ${i + 1}`,
            registeredAt: new Date().toISOString()
          }))
        : targetUser.fingerprintTemplateId
          ? [{ templateId: targetUser.fingerprintTemplateId, label: 'Slot 1', registeredAt: new Date().toISOString() }]
          : []
    );

    const updatedFps = existingFps.filter((f) => f.templateId !== templateId);
    const updatedIds = updatedFps.map((f) => f.templateId);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              fingerprintTemplateId: updatedIds[0],
              fingerprintTemplateIds: updatedIds,
              fingerprints: updatedFps,
            }
          : u
      )
    );

    setRooms((prev) =>
      prev.map((r) =>
        r.id === targetRoom?.id && r.usedFingerprints > 0
          ? { ...r, usedFingerprints: r.usedFingerprints - 1 }
          : r
      )
    );

    appendLog({
      deviceId: rooms[0]?.deviceId || 'ESP32-GENERIC',
      roomId: rooms[0]?.id || 'room-kk-netsec',
      roomName: rooms[0]?.name || 'Ruangan',
      userId: targetUser.id,
      userName: targetUser.name,
      fingerprintTemplateId: templateId,
      activityType: 'ENROLLMENT_FAILED',
      authResult: 'SYSTEM',
      details: `Sidik jari ID #${templateId} untuk ${targetUser.name} telah dihapus dari sistem dan modul DY50.`,
    });
  }, [users, rooms, appendLog]);

  const contextValue = useMemo(
    () => ({
      currentUser,
      users,
      rooms,
      logs,
      mqttMessages,
      selectedRoomId,
      connectionState,
      login,
      logout,
      setSelectedRoomId,
      triggerRemoteUnlock,
      forceRelock,
      requestRoomAccess,
      clearAlarm,
      connectMqtt,
      disconnectMqtt,
      connectSerial,
      disconnectSerial,
      addUser,
      registerUser,
      approveUserRegistration,
      rejectUserRegistration,
      extendUserAccess,
      updateUser,
      updateUserStatus,
      deleteUser,
      enrollFingerprint,
      cancelEnrollFingerprint,
      updateFingerprintLabel,
      removeFingerprint,
      clearMqttLogs,
      exportLogs,
    }),
    [
      currentUser,
      users,
      rooms,
      logs,
      mqttMessages,
      selectedRoomId,
      connectionState,
      login,
      logout,
      triggerRemoteUnlock,
      forceRelock,
      requestRoomAccess,
      clearAlarm,
      connectMqtt,
      disconnectMqtt,
      connectSerial,
      disconnectSerial,
      addUser,
      registerUser,
      approveUserRegistration,
      rejectUserRegistration,
      extendUserAccess,
      updateUser,
      updateUserStatus,
      deleteUser,
      enrollFingerprint,
      cancelEnrollFingerprint,
      updateFingerprintLabel,
      removeFingerprint,
      clearMqttLogs,
      exportLogs,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
