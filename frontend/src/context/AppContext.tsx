import React, { useState, useEffect, useRef } from 'react';
import { User, Room, AccessLog, MQTTMessage, UserRole, DoorStatus, DeviceStatus } from '../types';
import { INITIAL_USERS, INITIAL_ROOMS, INITIAL_LOGS } from '../mock/initialData';
import { AppContext } from './AppContextBase';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [logs, setLogs] = useState<AccessLog[]>(INITIAL_LOGS);
  const [mqttMessages, setMqttMessages] = useState<MQTTMessage[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const relockTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup relock timers on unmount
  useEffect(() => {
    const timers = relockTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const appendLog = (log: Omit<AccessLog, 'id' | 'eventId' | 'timestamp'>) => {
    const newLog: AccessLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      eventId: `EVT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const appendMQTT = (topic: string, payload: Record<string, unknown>, direction: 'INCOMING' | 'OUTGOING' = 'INCOMING') => {
    const msg: MQTTMessage = {
      id: `mqtt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      topic,
      payload,
      qos: 1,
      timestamp: new Date().toISOString(),
      direction,
    };
    setMqttMessages((prev) => [msg, ...prev.slice(0, 49)]);
  };

  const clearMqttLogs = () => {
    setMqttMessages([]);
  };

  const exportLogs = (format: 'json' | 'csv') => {
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
  };

  const login = (user: User) => {
    setCurrentUser(user);
    setSelectedRoomId(null);
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedRoomId(null);
  };

  const switchRole = (role: UserRole) => {
    const matched = users.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      setSelectedRoomId(null);
    }
  };

  const triggerRemoteUnlock = async (roomId: string): Promise<boolean> => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom || targetRoom.deviceStatus === 'OFFLINE') return false;

    // Verify user authorization: superadmin has global access, others must have room in accessibleRoomIds
    if (currentUser?.role !== 'superadmin' && !currentUser?.accessibleRoomIds.includes(roomId)) {
      return false;
    }

    if (relockTimersRef.current.has(roomId)) {
      clearTimeout(relockTimersRef.current.get(roomId)!);
      relockTimersRef.current.delete(roomId);
    }

    appendMQTT(`${targetRoom.mqttTopicPrefix}/cmd/unlock`, { action: 'UNLOCK', duration: 5, user: currentUser?.name }, 'OUTGOING');

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, lockStatus: 'UNLOCKED', relayStatus: 'ON', todayAccessCount: r.todayAccessCount + 1 }
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
      details: `Remote Unlock dieksekusi oleh ${currentUser?.name} (${currentUser?.roleLabel}). Relay 12V aktif 5s.`,
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
  };

  const forceRelock = (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    if (relockTimersRef.current.has(roomId)) {
      clearTimeout(relockTimersRef.current.get(roomId)!);
      relockTimersRef.current.delete(roomId);
    }

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, lockStatus: 'LOCKED', relayStatus: 'OFF' } : r
      )
    );

    appendMQTT(`${targetRoom.mqttTopicPrefix}/cmd/lock`, { action: 'FORCE_LOCK', user: currentUser?.name }, 'OUTGOING');

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userRole: currentUser?.role,
      activityType: 'REMOTE_UNLOCK',
      authResult: 'SUCCESS',
      details: `Kunci solenoid dihentikan paksa (Force Relock) seketika oleh ${currentUser?.name} (${currentUser?.roleLabel}). Relay dinonaktifkan.`,
      doorStatusAtEvent: targetRoom.doorStatus,
    });
  };

  const toggleDoorPhysics = (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    const nextDoorStatus: DoorStatus = targetRoom.doorStatus === 'OPEN' ? 'CLOSED' : 'OPEN';

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              doorStatus: nextDoorStatus,
              openDurationSeconds: nextDoorStatus === 'CLOSED' ? 0 : r.openDurationSeconds,
              isAlarmActive: nextDoorStatus === 'CLOSED' ? false : r.isAlarmActive,
            }
          : r
      )
    );

    appendMQTT(`${targetRoom.mqttTopicPrefix}/door`, { status: nextDoorStatus, sensor: 'MC-38' });

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      activityType: nextDoorStatus === 'OPEN' ? 'DOOR_OPENED' : 'DOOR_CLOSED',
      authResult: 'SYSTEM',
      details: `Sensor Magnetic Switch MC-38 mendeteksi status pintu ${nextDoorStatus}.`,
      doorStatusAtEvent: nextDoorStatus,
    });
  };

  const toggleDeviceOnline = (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    const nextStatus: DeviceStatus = targetRoom.deviceStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';

    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, deviceStatus: nextStatus } : r))
    );

    appendMQTT(`${targetRoom.mqttTopicPrefix}/status`, { status: nextStatus, ip: targetRoom.ipAddress });

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      activityType: nextStatus === 'ONLINE' ? 'DEVICE_ONLINE' : 'DEVICE_OFFLINE',
      authResult: 'SYSTEM',
      details: `Perangkat ESP32 (${targetRoom.deviceId}) status: ${nextStatus}.`,
      doorStatusAtEvent: targetRoom.doorStatus,
    });
  };

  const pingDevice = async (roomId: string): Promise<boolean> => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return false;

    appendMQTT(`${targetRoom.mqttTopicPrefix}/cmd/ping`, { ping: true, timestamp: Date.now() }, 'OUTGOING');

    const isSuccess = targetRoom.deviceStatus === 'ONLINE';

    if (isSuccess) {
      appendMQTT(`${targetRoom.mqttTopicPrefix}/telemetry/pong`, {
        pong: true,
        latencyMs: Math.floor(10 + Math.random() * 12),
        freeHeap: 184320,
        wifiRssi: -58,
      }, 'INCOMING');

      appendLog({
        deviceId: targetRoom.deviceId,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
        activityType: 'DEVICE_ONLINE',
        authResult: 'SYSTEM',
        details: `Diagnostic Ping MQTT QoS 1 berhasil ke ${targetRoom.deviceId} (${targetRoom.ipAddress}). Latency: 12ms. Node Sehat.`,
        doorStatusAtEvent: targetRoom.doorStatus,
      });
    } else {
      appendLog({
        deviceId: targetRoom.deviceId,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
        activityType: 'DEVICE_OFFLINE',
        authResult: 'FAILED',
        details: `Diagnostic Ping MQTT QoS 1 timeout. Node ${targetRoom.deviceId} tidak merespons (Offline).`,
        doorStatusAtEvent: targetRoom.doorStatus,
      });
    }

    return isSuccess;
  };

  const requestRoomAccess = async (roomId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom || !currentUser) return { success: false, message: 'Ruangan atau user tidak valid.' };

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      activityType: 'FINGERPRINT_AUTH',
      authResult: 'DENIED',
      details: `[PERMOHONAN AKSES] ${currentUser.name} (${currentUser.nipNim}) mengajukan izin akses ruangan ${targetRoom.name}. Alasan: "${reason}". Menunggu persetujuan Superadmin.`,
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
  };

  const simulateFingerprintScan = (roomId: string, user: User | null): boolean => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return false;

    if (user && user.status === 'ACTIVE' && user.accessibleRoomIds.includes(roomId)) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                lockStatus: 'UNLOCKED',
                relayStatus: 'ON',
                lastAccessTime: new Date().toISOString(),
                lastUserAccessed: user.name,
                todayAccessCount: r.todayAccessCount + 1,
              }
            : r
        )
      );

      appendMQTT(`${targetRoom.mqttTopicPrefix}/access`, {
        templateId: user.fingerprintTemplateIds?.[0] || user.fingerprintTemplateId || 99,
        status: 'GRANTED',
        userId: user.id,
      });

      appendLog({
        deviceId: targetRoom.deviceId,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        fingerprintTemplateId: user.fingerprintTemplateIds?.[0] || user.fingerprintTemplateId,
        activityType: 'FINGERPRINT_AUTH',
        authResult: 'SUCCESS',
        details: `Autentikasi AS608 Berhasil (Confidence: 97%). Akses terbuka 5s untuk ${user.name}.`,
        doorStatusAtEvent: targetRoom.doorStatus,
      });

      setTimeout(() => {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId ? { ...r, lockStatus: 'LOCKED', relayStatus: 'OFF' } : r
          )
        );
      }, 5000);

      return true;
    } else {
      appendMQTT(`${targetRoom.mqttTopicPrefix}/access`, { templateId: 0, status: 'DENIED' });

      appendLog({
        deviceId: targetRoom.deviceId,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        userId: user?.id,
        userName: user ? user.name : 'Unknown Fingerprint',
        activityType: 'FINGERPRINT_AUTH',
        authResult: user ? 'DENIED' : 'FAILED',
        details: user
          ? `Pengguna ${user.name} tidak memiliki hak akses pada ruangan ${targetRoom.name}.`
          : 'Sidik jari tidak terdaftar pada sensor AS608. Akses ditolak.',
        doorStatusAtEvent: targetRoom.doorStatus,
      });

      return false;
    }
  };

  const clearAlarm = (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    // Verify user authorization: superadmin or assigned admin/user
    if (currentUser?.role !== 'superadmin' && !currentUser?.accessibleRoomIds.includes(roomId)) {
      return;
    }

    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, isAlarmActive: false, openDurationSeconds: 0 } : r))
    );

    appendMQTT(`${targetRoom.mqttTopicPrefix}/alarm`, { alarm: 'CLEARED' });

    appendLog({
      deviceId: targetRoom.deviceId,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      activityType: 'ALARM_CLEARED',
      authResult: 'SYSTEM',
      details: 'Alarm door open timeout dinonaktifkan oleh administrator.',
      doorStatusAtEvent: targetRoom.doorStatus,
    });
  };

  // Door timeout counter tick
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.doorStatus === 'OPEN') {
            const nextSec = room.openDurationSeconds + 1;
            const triggerAlarm = nextSec >= room.maxOpenThresholdSeconds && !room.isAlarmActive;

            if (triggerAlarm) {
              appendMQTT(`${room.mqttTopicPrefix}/alarm`, { alarm: 'TRIGGERED', duration: nextSec });
              appendLog({
                deviceId: room.deviceId,
                roomId: room.id,
                roomName: room.name,
                activityType: 'ALARM_TRIGGERED',
                authResult: 'SYSTEM',
                details: `Pintu terbuka lebih dari batas waktu (${room.maxOpenThresholdSeconds}s)! Buzzer aktif.`,
                doorStatusAtEvent: 'OPEN',
              });
            }

            return {
              ...room,
              openDurationSeconds: nextSec,
              isAlarmActive: nextSec >= room.maxOpenThresholdSeconds,
            };
          }
          return room;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser = (userId: string, updatedData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updatedData };
          return updated;
        }
        return u;
      })
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updatedData } : prev));
    }
  };

  const updateUserStatus = (userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, status } : prev));
    }
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const enrollFingerprint = async (
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

    appendMQTT(`${targetRoom.mqttTopicPrefix}/cmd/enroll`, { action: 'START_ENROLL', userId, targetTemplateId: newTemplateId }, 'OUTGOING');

    await new Promise((res) => setTimeout(res, 2500));

    const defaultLabels = ['Jempol Kanan', 'Telunjuk Kanan', 'Jempol Kiri'];
    const chosenLabel = label && label.trim() !== '' ? label.trim() : defaultLabels[existingFps.length] || `Fingerprint #${existingFps.length + 1}`;

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

    appendMQTT(`${targetRoom.mqttTopicPrefix}/status`, {
      enrollResult: 'SUCCESS',
      templateId: newTemplateId,
      userId: targetUser.id,
    });

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
  };

  const updateFingerprintLabel = (userId: string, templateId: number, newLabel: string) => {
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
  };

  const removeFingerprint = (userId: string, templateId: number) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

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

    appendLog({
      deviceId: rooms[0]?.deviceId || 'ESP32-GENERIC',
      roomId: rooms[0]?.id || 'room-server',
      roomName: rooms[0]?.name || 'Ruangan',
      userId: targetUser.id,
      userName: targetUser.name,
      fingerprintTemplateId: templateId,
      activityType: 'ENROLLMENT_FAILED',
      authResult: 'SYSTEM',
      details: `Sidik jari ID #${templateId} untuk ${targetUser.name} telah dihapus.`,
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        rooms,
        logs,
        mqttMessages,
        selectedRoomId,
        login,
        logout,
        switchRole,
        setSelectedRoomId,
        triggerRemoteUnlock,
        forceRelock,
        toggleDoorPhysics,
        toggleDeviceOnline,
        pingDevice,
        requestRoomAccess,
        simulateFingerprintScan,
        clearAlarm,
        addUser,
        updateUser,
        updateUserStatus,
        deleteUser,
        enrollFingerprint,
        updateFingerprintLabel,
        removeFingerprint,
        clearMqttLogs,
        exportLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

