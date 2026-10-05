import React, { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context';
import { Layers, UserCheck, DoorClosed, Lock, Unlock, FileText, Cpu } from 'lucide-react';
import { NavTab } from './Header';
import { cn } from '@/lib/utils';
import { getUserAccessValidity } from '@/types';

interface BottomNavigationProps {
  currentTab?: NavTab;
  setCurrentTab?: (tab: NavTab) => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  hasAlert?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab: propTab,
  setCurrentTab,
}) => {
  const { currentUser, selectedRoomId, setSelectedRoomId, rooms, users } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Calculate pending alerts for Superadmin to show mini red dot
  const hasPendingAlerts = useMemo(() => {
    if (!currentUser || currentUser.role !== 'superadmin') return false;
    const pendingReqs = users.some((u) => u.status === 'PENDING_APPROVAL');
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const lifecycleAlerts = users.some((u) => {
      if (u.status === 'PENDING_APPROVAL' || u.status === 'REJECTED') return false;
      const validity = getUserAccessValidity(u);
      if (validity.isExpired || u.status === 'EXPIRED') return true;
      if (u.validUntil) {
        const diff = new Date(u.validUntil).getTime() - now;
        return diff > 0 && diff <= sevenDaysMs;
      }
      return false;
    });
    return pendingReqs || lifecycleAlerts;
  }, [currentUser, users]);

  const getActiveTab = (): NavTab => {
    if (propTab) return propTab;
    const path = location.pathname;
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/logs')) return 'logs';
    if (path.startsWith('/hardware')) return 'hardware';
    return 'rooms';
  };

  const activeTab = getActiveTab();
  const isRoomDetail = location.pathname.startsWith('/rooms/') && location.pathname !== '/rooms';

  // Extract roomId from path if in detail
  const pathRoomId = isRoomDetail ? location.pathname.replace('/rooms/', '') : null;
  const activeRoomId = pathRoomId || selectedRoomId;
  const selectedRoom = rooms.find((r) => r.id === activeRoomId);

  const handleSelectRooms = useCallback(() => {
    setSelectedRoomId(null);
    if (setCurrentTab) {
      setCurrentTab('rooms');
    } else {
      navigate('/rooms');
    }
  }, [setSelectedRoomId, setCurrentTab, navigate]);

  const handleSelectActiveRoom = useCallback(() => {
    if (activeRoomId) {
      if (setCurrentTab) {
        setCurrentTab('rooms');
      } else {
        navigate(`/rooms/${activeRoomId}`);
      }
    }
  }, [activeRoomId, setCurrentTab, navigate]);

  const handleSelectLogs = useCallback(() => {
    setSelectedRoomId(null);
    if (setCurrentTab) {
      setCurrentTab('logs');
    } else {
      navigate('/logs');
    }
  }, [setSelectedRoomId, setCurrentTab, navigate]);

  const handleSelectHardware = useCallback(() => {
    setSelectedRoomId(null);
    if (setCurrentTab) {
      setCurrentTab('hardware');
    } else {
      navigate('/hardware');
    }
  }, [setSelectedRoomId, setCurrentTab, navigate]);

  const handleSelectUsers = useCallback(() => {
    setSelectedRoomId(null);
    if (setCurrentTab) {
      setCurrentTab('users');
    } else {
      navigate('/users');
    }
  }, [setSelectedRoomId, setCurrentTab, navigate]);

  const navItems: NavItemConfig[] = useMemo(() => {
    if (!currentUser) return [];

    const items: NavItemConfig[] = [
      {
        id: 'rooms',
        label: 'Ruangan',
        icon: Layers,
        isActive: activeTab === 'rooms' && !isRoomDetail,
        onClick: handleSelectRooms,
      },
    ];

    if (isRoomDetail || selectedRoomId) {
      const isUnlocked = selectedRoom?.lockStatus === 'UNLOCKED';
      items.push({
        id: 'active-room',
        label: 'Detail',
        icon: isUnlocked ? Unlock : (selectedRoom ? DoorClosed : Lock),
        isActive: isRoomDetail,
        onClick: handleSelectActiveRoom,
      });
    }

    items.push({
      id: 'logs',
      label: 'Log Audit',
      icon: FileText,
      isActive: activeTab === 'logs',
      onClick: handleSelectLogs,
    });

    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      items.push({
        id: 'hardware',
        label: 'Hardware',
        icon: Cpu,
        isActive: activeTab === 'hardware',
        onClick: handleSelectHardware,
      });
    }

    if (currentUser.role === 'superadmin') {
      items.push({
        id: 'users',
        label: 'Pengguna',
        icon: UserCheck,
        isActive: activeTab === 'users',
        onClick: handleSelectUsers,
        hasAlert: hasPendingAlerts,
      });
    }

    return items;
  }, [
    currentUser,
    activeTab,
    isRoomDetail,
    selectedRoomId,
    selectedRoom,
    handleSelectRooms,
    handleSelectActiveRoom,
    handleSelectLogs,
    handleSelectHardware,
    handleSelectUsers,
  ]);

  if (!currentUser) return null;

  return (
    <nav
      className="w-full safe-pb font-sans"
      aria-label="Navigasi Aplikasi"
    >
      <div
        className="bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl p-1 flex items-center justify-around gap-1"
        role="tablist"
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.isActive}
              aria-label={item.label}
              onClick={item.onClick}
              className={cn(
                "flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-150 cursor-pointer select-none min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 active:scale-95",
                item.isActive
                  ? "bg-white text-[#5645d4] font-semibold shadow-xs border border-[#e6e6e6]"
                  : "text-[#615d59] hover:text-[#000000] hover:bg-white/60 font-medium"
              )}
            >
              <div className="relative flex items-center justify-center">
                <IconComponent
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    item.isActive ? "text-[#5645d4]" : "text-[#615d59]"
                  )}
                />
                {item.hasAlert && !item.isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e03131] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e03131] ring-1.5 ring-white" />
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] tracking-tight truncate max-w-[70px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
